# Task 3: Feedback Form with MongoDB Storage & File Uploads

A production-grade, full-stack web application demonstrating advanced data flow handling between a client-side user interface and a backend server engine. This project showcases asynchronous multipart/form-data processing, server-side structural data validation, localized disk file storage, and persistent document mapping via a relational MongoDB database.

---

## Project Deployment Links

* **Source Code Repository:** [https://github.com/bhumi-patre08/Feedback](https://github.com/bhumi-patre08/Feedback)

---

## Application Architecture & Data Flow

1. **Client Payload Submission:** The frontend UI packages native text inputs and binary file uploads together into an immutable `FormData` object. It transmits this payload via an asynchronous Javascript `fetch` POST request to `/feedback`.
2. **Multipart Data Ingestion:** The backend server uses `multer` middleware to safely intercept the incoming multipart stream, routing the binary asset directly to the disk storage system while parsing the textual fields into `req.body`.
3. **Data Sanitization & Validation:** The server verifies that all mandatory text elements exist and runs a custom regular expression (regex) sequence to validate the email string structure.
4. **Persistent Database Ingestion:** Once validated, the data model is mapped into a defined Mongoose Schema, enriched with a secure server-side file location reference, and securely written into a persistent MongoDB document collection.

---

## Implemented Features Checklist

### 1. Frontend Architecture (User Interface)
- **Multipart Form Layout:** Designed an accessible HTML5 submission portal supporting basic text entry alongside file attachment uploads (PDFs, PNGs, JPGs).
- **Asynchronous Stream Handling:** Configured data transmission via the browser Fetch API utilizing `FormData` streams to completely avoid disruptive page reloads.

### 2. Backend Server Architecture (Express REST API)
- **Express Server Configurations:** Initialized a lightweight backend routing environment powered by Express running on port 3000.
- **Multer Disk Engine Allocation:** Integrated file-handling middleware configured to process disk storage operations, incorporating timestamp prefixes on filenames to eliminate namespace collision risks.
- **Input Sanitization Filters:** Implemented strict conditional logic validation for mandatory fields alongside backend structural email validations.

### 3. Database Layer & Model Modeling
- **Persistent MongoDB Connectivity:** Extended backend services to establish data connections to a MongoDB instance utilizing Mongoose ODM drivers.
- **Structured Schemas:** Configured data schemas defining structural typing for `name`, `email`, `message`, and `filePath` attributes alongside automated internal database generation trackers.

### 4. API Response Protocol
- **Success Handlers (`201 Created`):** Transmits an explicit HTTP 201 response containing the successfully written document payload back to the UI upon successful indexing.
- **Error Handlers (`400 Bad Request`):** Intercepts broken email formats or blank entries, returning informative error strings to alert the client interface.

---

## 🚀 Local Installation & Setup

To execute, inspect, or test this full-stack application on your machine:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/bhumi-patre08/Feedback.git

2.Navigate into the directory folder:
  Bash
  cd Feedback
  
3.Install the required dependencies:
  Bash
  npm install express mongoose multer

4.Verify your Database Environment:
Ensure your local MongoDB community server instance is actively running on your machine (mongodb://localhost:27017).

5.Boot up the server:
  Bash
  node server.js

6.Interact with the application:
  Open your browser and navigate to http://localhost:3000 to run test submissions through the form.
