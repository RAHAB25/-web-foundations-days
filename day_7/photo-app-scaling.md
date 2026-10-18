# SnapShare: scaling plan

SnapShare is a photo-sharing app. Users upload photos and scroll a feed of photos from the people they follow. This plan estimates the load, then designs a system that can handle it.

## 1. Assumptions

Starting facts (given):

- 10,000,000 registered users
- 10% of them are active on any given day
- Each active user uploads 1 photo per day
- Each active user views 50 feed pages per day
- An average photo is 2 MB, and each photo also gets a 50 KB thumbnail

Assumptions I added to make the maths possible:

- Traffic is spread evenly over 24 hours for the **average** figures (1 day = 86,400 seconds).
- **Peak** traffic is 5x the average, as instructed.
- Each feed page view is one request to the backend.
- Every photo gets exactly one thumbnail, and no photos are deleted.
- No user growth during the year (this is a snapshot, not a forecast).
- Storage uses decimal units (1 TB = 1,000,000 MB) and counts one copy of each file. The storage provider keeps extra copies for durability, which I am not counting here.

**Daily active users (DAU)** = 10,000,000 x 10% = **1,000,000**

## 2. Estimates

### Uploads per second

- Uploads per day = 1,000,000 users x 1 photo = 1,000,000
- Average = 1,000,000 / 86,400 = **about 11.6 uploads/second**
- Peak = 11.6 x 5 = **about 58 uploads/second**

### Feed views per second

- Feed views per day = 1,000,000 users x 50 = 50,000,000
- Average = 50,000,000 / 86,400 = **about 579 views/second**
- Peak = 579 x 5 = **about 2,900 views/second**

### Photo storage per year

| Item | Per day | Per year (x 365) |
|---|---|---|
| Original photos (1,000,000 x 2 MB) | 2 TB | 730 TB |
| Thumbnails (1,000,000 x 50 KB) | 50 GB | 18.25 TB |
| **Total** | **2.05 TB** | **about 748 TB (roughly 0.75 PB)** |

The thumbnails add only about 2.5% on top of the originals, so storage cost is almost entirely the original photos.

One more figure that matters for the design: at peak, 58 uploads/second x 2 MB is about 116 MB/s of incoming photo data (roughly 0.9 Gbit/s). That is a lot of bytes to push through application servers, which is why the upload flow below sends the file straight to object storage.

## 3. Read-heavy or write-heavy?

**SnapShare is read-heavy.** Each active user does 50 feed views for every 1 upload, so reads outnumber writes about **50 to 1** (about 579 reads/second against 11.6 writes/second on average).

What that means for the design:

- **Make reads cheap and fast first.** Put a CDN in front of the photo files and a cache in front of the database so most reads never reach the database at all.
- **Add read replicas.** Feed queries go to a copy of the database, which keeps the main database free for writes.
- **Accept that writes can be slower.** A user waiting a second or two for an upload is fine, so heavy work (thumbnails) can be pushed into the background.
- **Scale the read side horizontally.** More app servers, more cache nodes and more replicas are cheap ways to add read capacity. The write side (one primary database) is the part that is harder to scale, but at about 12 to 58 writes/second it is nowhere near its limit.

## 4. Why photos should not be stored inside the database

A database is built to store and query small, structured records (user, caption, timestamp, who follows whom). Photos are large binary files, and putting them in the database causes real problems:

- **Size:** 730 TB of new photos per year would make the database enormous. Backups, restores and replication would become slow and expensive.
- **Cost:** database storage is far more expensive per GB than object storage.
- **Performance:** every photo download would tie up a database connection and memory that should be answering queries, and the database cannot hand files to a CDN.
- **Scaling:** databases are hard to scale for huge volumes of files, while object storage is designed for it.

**Where they go instead:** photo files go in **object storage** (for example Amazon S3 or Google Cloud Storage). The database stores only the **metadata**: the photo's ID, owner, caption, upload time, status, and the object storage key (the file's address). The app and the CDN use that key to fetch the file.

## 5. Architecture diagram

```
                          +-----------------------+
                          |   Users (phone / web) |
                          +-----------+-----------+
                                      |
              +-----------------------+------------------------+
              |                                                |
      photo files (GET)                                API calls: feed,
      thumbnails + originals                           login, upload request
              |                                                |
              v                                                v
     +-----------------+                              +-----------------+
     |       CDN       |                              |  Load Balancer  |
     +--------+--------+                              +--------+--------+
              | cache miss                                     |
              |                                  +-------------+-------------+
              |                                  |             |             |
              |                              +---v---+     +---v---+     +---v---+
              |                              | App   |     | App   |     | App   |
              |                              |Server1|     |Server2|     |Server3|
              |                              +--+-+--+     +--+-+--+     +--+-+--+
              |                                 | |           | |           | |
              |          +----------------------+ +-----------+ +-----------+ |
              |          |   (all app servers talk to all of these)           |
              |          |                                                    |
              |   +------v------+     +---------------------------+   +------v------+
              |   |    Cache    |     |         Database          |   |    Queue    |
              |   | (feeds,     |     |  +---------+  replicates  |   | (thumbnail  |
              |   |  hot data)  |     |  | Primary |------+       |   |  jobs)      |
              |   +-------------+     |  | (writes)|      |       |   +------+------+
              |                       |  +---------+  +---v-----+ |          |
              |                       |               | Read    | |          |
              |                       |               | Replica | |          v
              |                       |               | (reads) | |   +-------------+
              |                       |               +---------+ |   |   Worker(s) |
              |                       +---------------------------+   | make        |
              |                                                       | thumbnails  |
              |                                                       +------+------+
              |                                                              |
              |         +--------------------------------------+             |
              +-------->|           Object Storage             |<------------+
                        |  originals (2 MB) + thumbnails (50KB)|
                        +--------------------------------------+
                                       ^
                                       |
              direct upload using a short-lived upload link (see section 7)
                                       |
                                  Users (upload)
```

How to read it: the **left side** is the photo path (users download files from the CDN, which fetches from object storage only when it does not already have a copy). The **right side** is the data path (API requests go through the load balancer to app servers, which use the cache, the database, and the queue). Uploads go straight from the user to object storage using a link the app server hands out.

## 6. What each component does (one sentence each)

- **CDN:** It keeps copies of photos on servers close to users, so images load fast and most photo traffic never reaches your own servers or object storage.
- **Load balancer:** It spreads incoming requests across many app servers and stops sending traffic to any server that is down, so no single server is overwhelmed or a single point of failure.
- **App servers:** They run the application logic (login, building the feed, handling uploads), and because they keep no user data themselves you can add more of them as traffic grows.
- **Cache:** It stores frequently needed results, such as a user's recent feed and photo metadata, in memory so repeated reads are answered in microseconds without hitting the database.
- **Database (primary):** It is the single source of truth for users, follows, and photo metadata, and it handles all the writes.
- **Read replica:** It is a live copy of the primary that answers feed queries, so the heavy read load does not slow down the writes on the primary.
- **Object storage:** It holds the photo files cheaply and durably at any size, which the database could not do economically.
- **Queue:** It holds "make a thumbnail" jobs safely until a worker is free, so uploads are not delayed by slow image processing and no job is lost during a traffic spike.
- **Worker:** It picks jobs off the queue and creates the 50 KB thumbnail in the background, so the user does not have to wait for it.

## 7. Upload flow, step by step

1. The user picks a photo and taps upload. The app sends a request to SnapShare through the **load balancer** to an **app server**.
2. The app server checks the user is logged in and the file looks valid (type and size limit).
3. The app server creates a row in the **database** with the owner, caption, a new photo ID, the planned object storage key, and status `processing`.
4. The app server asks object storage for a **short-lived upload link** (a pre-signed URL) for that key and returns it to the app.
5. The user's app uploads the 2 MB file **directly to object storage** using that link. The file never passes through the app servers.
6. When the upload finishes, the app tells the app server (or object storage notifies it) that the original is stored.
7. The app server puts a **"create thumbnail" job** on the **queue** containing the photo ID and key, then immediately tells the user the upload succeeded. The user is not kept waiting for thumbnail work.
8. A **worker** takes the job from the queue, downloads the original from object storage, creates the 50 KB thumbnail, and saves it back to object storage.
9. The worker updates the photo's database row to status `ready` and records the thumbnail key. If the worker crashes before finishing, the job returns to the queue and another worker retries it.
10. The app server clears or updates the relevant **cache** entries, so the photo can appear in followers' feeds. When a follower scrolls, the app loads the thumbnail through the **CDN**.

Until step 9, the photo can be shown to its owner with a placeholder or the original, so the upload still feels instant.

## 8. Trade-offs

1. **Cache speed vs fresh data.** Caching feeds makes reads fast and protects the database, but a cached feed can be slightly out of date, so a new photo might take a few seconds to appear for followers. A shorter cache lifetime gives fresher feeds but more database load. For a photo feed, a few seconds of staleness is acceptable, so I choose speed.
2. **Read replica lag.** The replica copies data from the primary a moment after it is written, so a read from the replica can briefly miss a just-uploaded photo (for example, the user uploads then refreshes and does not see it). The fix is to read the user's own recent uploads from the primary, which adds a little complexity, but it lets the replica carry most of the read load.
3. **Background thumbnails vs instant availability.** Using a queue and worker makes uploads fast and the system resilient to spikes, but the thumbnail does not exist for a second or two after upload. The app has to handle that gap with a placeholder. The alternative, making thumbnails during the upload request, is simpler but slows every upload and ties up app servers.
4. **Direct-to-storage upload vs simplicity.** Sending the photo straight to object storage keeps about 116 MB/s of peak upload traffic off the app servers, but it adds extra steps (upload links, a completion callback). Uploading through the app server is easier to build, but you would need many more app servers just to carry file bytes.
5. **CDN cost vs speed.** A CDN makes images load quickly worldwide and takes load off storage, but you pay for it by the gigabyte, and old or rarely viewed photos may not stay in the CDN cache. That is acceptable because most views are of recent photos.