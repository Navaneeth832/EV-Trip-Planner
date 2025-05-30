# Project Title - AI Powered Trip Planner

This project is an AI-powered trip planner that helps you generate customized travel itineraries using the power of generative AI. Plan your next adventure with ease!

## Prerequisites

Before you begin, ensure you have [Node.js](https://nodejs.org/) installed on your system.

## Run Locally

Follow these steps to get your development environment set up and running:

1.  **Install dependencies:**
    Open your terminal and navigate to the project directory. Then, run the following command to install the necessary dependencies:
    ```bash
    npm install
    ```

2.  **Set up your environment variables:**
    Create a new file named `.env.local` in the root of your project directory. Add the following line to this file, replacing `YOUR_API_KEY_HERE` with your actual Gemini API key:
    ```env
    GEMINI_API_KEY=YOUR_API_KEY_HERE
    ```

3.  **Start the development server:**
    Once the dependencies are installed and your environment variable is set, you can start the development server by running:
    ```bash
    npm run dev
    ```
    This will typically start the application on `http://localhost:3000` (or another port if specified in your Vite configuration). Open this URL in your web browser to see the application.

## Features

*   **Interactive Map Selection:** Easily select your desired destination and points of interest on a map.
*   **AI-Powered Itinerary Generation:** Leverage the Gemini API to automatically create a personalized trip plan.
*   **Customizable Trip Display:** View and modify your generated itinerary.
*   **User-Friendly Interface:** Intuitive design for a seamless user experience.

## Technologies Used

This project is built with a modern technology stack:

*   **Frontend:**
    *   [React](https://reactjs.org/) - A JavaScript library for building user interfaces.
    *   [TypeScript](https://www.typescriptlang.org/) - A typed superset of JavaScript that compiles to plain JavaScript.
    *   [Vite](https://vitejs.dev/) - A fast build tool and development server.
*   **APIs:**
    *   [Google Maps API](https://developers.google.com/maps) - For map integration and location services.
    *   [Gemini API](https://ai.google.dev/docs/gemini_api) - For generative AI capabilities to create itineraries.

## Contributing

Contributions are welcome! If you have ideas for improvements or new features, please feel free to:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/YourFeature`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'Add some YourFeature'`).
5.  Push to the branch (`git push origin feature/YourFeature`).
6.  Open a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE.md file for details (if applicable).
