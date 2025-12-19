# Pookie Mistakes

A sweet way to log and track complaints with love and care. Built with React, TypeScript, and MongoDB.

## Features

- 💝 Beautiful and responsive UI
- 📝 Submit and track complaints
- 🔒 Admin dashboard for acknowledging complaints
- 💾 Persistent storage with MongoDB
- 🌐 Always available online
- 📱 Mobile-friendly design

## Tech Stack

- React
- TypeScript
- MongoDB Atlas
- Vercel (Hosting)
- Axios (API calls)

## Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file with your MongoDB connection string:
   ```
   MONGODB_URI=your_mongodb_connection_string
   ```
4. Start the development server:
   
   **For frontend-only development (no API):**
   ```bash
   npm run dev
   ```
   
   **For full development with API support (requires Vercel CLI):**
   ```bash
   npm install -g vercel
   npm run dev:vercel
   ```
   
   Note: The API routes (serverless functions) only work when using `vercel dev` or when deployed to Vercel. For local API testing, use `npm run dev:vercel`.

## Deployment

- The application is deployed to Vercel. Connect your GitHub repository to Vercel at https://vercel.com/import and set your MongoDB Atlas environment variables in the Vercel dashboard.

## Environment Variables

- `MONGODB_URI`: Your MongoDB Atlas connection string

## License

MIT 