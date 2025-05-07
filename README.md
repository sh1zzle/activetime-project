# Sleep Tracker & Productivity Analysis

A web application to track sleep patterns and analyze their impact on productivity using Next.js, MongoDB, and modern web technologies.

## Features

- Sleep tracking with quality ratings
- Productivity analysis
- Data visualization
- User authentication
- Responsive design

## Tech Stack

- **Frontend**: Next.js 13+ (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: TanStack Query
- **Authentication**: NextAuth.js
- **Database**: MongoDB
- **API**: Axios
- **Deployment**: Vercel

## Getting Started

1. Clone the repository:

```bash
git clone [your-repo-url]
cd [your-repo-name]
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the root directory with the following variables:

```
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

4. Run the development server:

```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   └── components/        # Shared components
├── lib/                   # Utility functions
├── models/                # Database models
├── types/                 # TypeScript types
└── utils/                 # Helper functions
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
