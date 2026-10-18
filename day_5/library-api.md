# Library API Design

A REST API for a library's **books** resource. The base path is `/books`.

## Endpoints

### 1. List all books
- **Method and path:** `GET /books`
- **Description:** Returns every book in the library.
- **Success status:** `200 OK`

### 2. Get one book
- **Method and path:** `GET /books/{id}`
- **Description:** Returns the book with the given id.
- **Success status:** `200 OK`

### 3. Create a book
- **Method and path:** `POST /books`
- **Description:** Adds a new book to the library.
- **Example request body:**
```json
  {
    "title": "Things Fall Apart",
    "author": "Chinua Achebe",
    "year": 1958,
    "isbn": "9780385474542"
  }
```
- **Success status:** `201 Created`

### 4. Replace a book
- **Method and path:** `PUT /books/{id}`
- **Description:** Replaces the whole book record with the data sent.
- **Example request body:**
```json
  {
    "title": "Things Fall Apart",
    "author": "Chinua Achebe",
    "year": 1958,
    "isbn": "9780385474542"
  }
```
- **Success status:** `200 OK`

### 5. Update part of a book
- **Method and path:** `PATCH /books/{id}`
- **Description:** Changes only the fields that are sent.
- **Example request body:**
```json
  { "year": 1959 }
```
- **Success status:** `200 OK`

### 6. Delete a book
- **Method and path:** `DELETE /books/{id}`
- **Description:** Removes the book from the library.
- **Success status:** `204 No Content`

### 7. List books by an author
- **Method and path:** `GET /books?author=Chinua%20Achebe`
- **Description:** Returns only the books written by the author in the query parameter.
- **Success status:** `200 OK`

## Error codes

### 400 Bad Request
The request is invalid, so the server cannot process it.
- **Example:** `POST /books` with a body that is missing the required `title`, or with `year` set to `"abc"` instead of a number.

### 404 Not Found
The requested resource does not exist.
- **Example:** `GET /books/9999` when no book has the id 9999.
- **Example:** `DELETE /books/9999` for a book that was already deleted.