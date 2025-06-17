

## Getting Started

### 1. Clone the project

```bash
git clone https://github.com/yashvyas1111/pdf-certificate-generator.git
cd pdf-certificate-generator



2. Setup environment variables
Go to the server folder:


cd server
Copy the example environment file and edit it:


cp .env.example .env
Open .env and fill in your credentials:

MONGO_CONN=your_mongodb_connection_string
PORT=5009
JWT_SECRET=your_jwt_secret_key
EMAIL_USER=your_email@example.com
EMAIL_APP_PASS=your_email_app_password


3. Install dependencies
Install backend dependencies: 
in backend folder run:
npm install
Go back to the project root and then to the frontend folder:

cd ../client
npm install
4. Run the project
Start the backend server:

cd ../server
node index.js
Start the frontend server (in a new terminal):


cd ../client
npm run dev

