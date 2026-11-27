
# LearnTok

## Overview

LearnTok is a client side web application that uses a Firestore database to record user data such as accounts, posted videos, completed quizzes, liked videos and more.

The goal of the application is to provide any user with quick snippets of education content that they can then test themselves on immediatley, or just scroll to the next video.

The application features a scrollable video page where a user can infinitely scroll through content uploaded by creators. Each piece of content is a video, and each video can have 1 practice document and quiz attached for the user to read and complete.

A creator is someone who has been verified as having a degree in a specific field, among other qualities.

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Backend**: Firebase for hosting
- **Database**: Firestore

## Usage

To run the application locally:

1.  **Clone** the repository.
2.  **Install dependencies** by running `npm install` in the project root directory.
3.  **Start the development server** by running the command: `npm run dev`.
4.  Open your browser and visit the local address shown in your terminal (usually `http://localhost:5173` or similar).

Once the application is running:

1.  Browse the list of hiking trails displayed on the main page.
2.  Click the heart icon (or similar) to mark a trail as a favorite.
3.  View your favorite hikes in the favorites section.

## Contributors
- **Warren Chemerika**
- **Sean Shangguan**
- **Horad Ghaderi**

## Acknowledgments

- Hoda Rashedi for teaching us about Firebase and Firestore.
- marked library from npm.
- Bootrap Icons for providing the icons for the application.
- MDN web docs for providing Javascript documentation.

## Limitations and Future Work

### Limitations

- Currently there is no creator side to the application.
- Other users profile cannot be visited (even 'creator' accounts).
- Users can only complete a small set of the originally intended actions.
- There is no financial incentive for creators to upload on this platform.

### Future Work

- Add a creator signup page.
- Add a video upload form.
- Allow users to complete more basic application within the application.
- Make quizzes mean something to the user. Currently, a user completes a quiz gets their score and moves on which is not as exciting as a badge or leveling system!