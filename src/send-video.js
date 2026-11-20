import { app } from '/src/firebaseConfig.js';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const db = getFirestore(app);
const auth = getAuth(app);

/* ------------------------------------------------------------------ */
/* Quiz helpers                                                        */
/* If your <quiz-builder>.toJSON() output has a different shape,       */
/* change ONLY the three helpers below and the data stays as is.       */
/* ------------------------------------------------------------------ */
const single = (question, answers) => buildQuestion('radio', question, answers);
const multi = (question, answers) => buildQuestion('checkbox', question, answers);

// answers: array of [text, isCorrect]
function buildQuestion(type, question, answers) {
    return {
        type, // "radio" (single choice) | "checkbox" (multiple choice)
        question,
        answers: answers.map(([text, isAnswer]) => ({ text, isAnswer })),
    };
}

/* ------------------------------------------------------------------ */
/* Video data                                                          */
/* ------------------------------------------------------------------ */
const videos = [
    /* ---------------------------- MATH ---------------------------- */
    {
        seedId: 'seed-prime-numbers',
        video_url: '', // TODO: paste your video link
        title: 'Prime Numbers in 30 Seconds: The Building Blocks of Math',
        description:
            'Discover what makes a number prime, how the Sieve of Eratosthenes finds them, why there are infinitely many, and how primes keep your passwords safe.',
        tags: ['Math'],
        quiz: [
            single('Which is the only even prime number?', [
                ['2', true],
                ['4', false],
                ['6', false],
                ['10', false],
            ]),
            single('Which of these is NOT prime?', [
                ['17', false],
                ['21', true],
                ['23', false],
                ['29', false],
            ]),
            multi('Which of these numbers are prime?', [
                ['11', true],
                ['15', false],
                ['13', true],
                ['27', false],
                ['31', true],
            ]),
            single('Who invented a "sieve" for finding prime numbers?', [
                ['Pythagoras', false],
                ['Eratosthenes', true],
                ['Newton', false],
                ['Euler', false],
            ]),
            multi('Which statements about primes are true?', [
                ['There are infinitely many primes', true],
                ['Large primes help secure online data', true],
                ['Every prime number is odd', false],
                ['1 is a prime number', false],
            ]),
        ],
        assignment: `# Prime Numbers: Practice Page

## Warm-Up
1. List every prime number less than 30.
2. Is 91 prime? Show how you decided.
3. Write the **prime factorization** of 60.

## Hands-On
4. Draw a grid of the numbers 1-50 and run the Sieve of Eratosthenes
   by hand. Which numbers are left?
5. How many primes are there between 1 and 100? Check your count
   against the sieve.

## Go Explore (you'll need to search for these!)
6. What are **twin primes**? Find three pairs under 100.
7. What is the **Goldbach Conjecture**? Test it on four even numbers
   of your choice.
8. What is a **Mersenne prime**? What is the largest one currently known?
9. In your own words, explain how primes are used in **RSA encryption**.

## Challenge
10. Explain why 2 is the only even prime.
11. Look up **Euclid's proof** that there are infinitely many primes.
    Rewrite it in your own words.
`,
    },

    /* ------------------------- PROGRAMMING ------------------------- */
    {
        seedId: 'seed-coding-building-blocks',
        video_url: '', // TODO: paste your video link
        title: '3 Coding Building Blocks in 30 Seconds: Variables, Loops & Functions',
        description:
            'Every program is built from a few simple ideas. Learn what variables, loops, and functions are with quick Python examples you can try yourself.',
        tags: ['Programming', 'Technology'],
        quiz: [
            single('What does a variable do?', [
                ['Stores a value under a name', true],
                ['Repeats code', false],
                ['Deletes a program', false],
                ['Draws on the screen', false],
            ]),
            single('Which building block repeats code multiple times?', [
                ['Variable', false],
                ['Loop', true],
                ['Comment', false],
                ['Function name', false],
            ]),
            multi('Which of these are building blocks from the video?', [
                ['Variables', true],
                ['Loops', true],
                ['Functions', true],
                ['Pixels', false],
            ]),
            single('How many times does this print "Hi"? for i in range(3): print("Hi")', [
                ['1', false],
                ['2', false],
                ['3', true],
                ['4', false],
            ]),
            single('Which Python keyword defines a function?', [
                ['func', false],
                ['def', true],
                ['loop', false],
                ['make', false],
            ]),
        ],
        assignment: `# Coding Building Blocks: Practice Page

*Use Python (or any language you like). You can run code for free
at an online editor such as replit.com or python.org's shell.*

## Warm-Up
1. Create a variable called \`name\` and a variable called \`age\`.
   Print them in a sentence.
2. What do you think this prints? Predict first, then run it.

\`\`\`python
x = 5
x = x + 2
print(x)
\`\`\`

## Loops
3. Write a loop that prints the numbers 1 to 10.
4. Modify it to print only the **even** numbers.
5. Write a loop that prints a countdown from 10 to 1, then "Liftoff!".

## Functions
6. Write a function \`square(n)\` that returns \`n * n\`.
7. Write a function \`greet(name)\` that prints a custom greeting.
   Call it with three different names.
8. Combine all three: write a function that takes a number \`n\` and
   prints the multiplication table for \`n\` from 1 to 10.

## Go Explore (you'll need to search for these!)
9. What is the difference between a \`for\` loop and a \`while\` loop?
   When would you pick each one?
10. What is a **parameter** versus an **argument**?
11. What is **scope**? Why can't you always use a variable
    that was created inside a function?
12. What is **recursion**? Write a function that counts down
    from \`n\` by calling itself.

## Challenge
13. Write a program that prints the first 10 numbers of the
    **Fibonacci sequence**.
14. Write the classic **FizzBuzz** program (look up the rules!).
`,
    },

    /* ----------------------------- ART ----------------------------- */
    {
        seedId: 'seed-color-theory',
        video_url: 'seed.', // TODO: paste your video link
        title: 'Color Theory in 30 Seconds: Primary, Complementary, Warm & Cool',
        description:
            'Learn how the color wheel works, why complementary colors make each other pop, and how warm and cool colors change the mood of a painting or design.',
        tags: ['Art', 'Graphic Design'],
        quiz: [
            single('What are the three traditional primary colors in art?', [
                ['Red, green, blue', false],
                ['Red, yellow, blue', true],
                ['Orange, green, purple', false],
                ['Black, white, gray', false],
            ]),
            single('Which color is complementary to blue?', [
                ['Green', false],
                ['Purple', false],
                ['Orange', true],
                ['Red', false],
            ]),
            multi('Which of these are warm colors?', [
                ['Red', true],
                ['Orange', true],
                ['Blue', false],
                ['Yellow', true],
            ]),
            single('What does a color wheel show?', [
                ['How loud colors are', false],
                ['How colors relate to each other', true],
                ['Which paint brand is best', false],
                ['How to draw perspective', false],
            ]),
            multi('Which pairs are complementary colors?', [
                ['Red and green', true],
                ['Yellow and purple', true],
                ['Blue and green', false],
                ['Red and orange', false],
            ]),
        ],
        assignment: `# Color Theory: Practice Page

*Materials: paper plus anything that makes color (paint, markers,
colored pencils, or a free digital tool like Canva or Krita).*

## Warm-Up
1. Draw a color wheel with 12 sections. Start with red, yellow and
   blue, then fill in the colors you can make by mixing them.
2. Label which half of your wheel is warm and which is cool.

## Hands-On
3. Paint or draw the same simple scene (a house, a tree, a sun)
   twice: once using only **warm** colors and once using only
   **cool** colors. How does the mood change?
4. Pick a complementary pair. Place small squares of each color side
   by side, then each on a neutral background. What do you notice?
5. Mix a complementary pair together. What color do you get?

## Go Explore (you'll need to search for these!)
6. What is the difference between **RGB** and **CMYK**? Why are the
   primary colors different from the ones in the video?
7. What are **analogous** colors? What is a **triadic** color scheme?
8. What do **hue**, **saturation** and **value** mean?
9. Look up *Starry Night* by Van Gogh. Which complementary colors
   does he use, and where?
10. How do brands use color psychology? Pick a logo you like and
    explain its color choices.

## Challenge
11. Design a poster for a school event using exactly three colors
    from a color scheme (complementary, analogous or triadic).
    Write one paragraph explaining your choices.
`,
    },
];

/* ------------------------------------------------------------------ */
/* Upload                                                              */
/* ------------------------------------------------------------------ */
async function uploadVideos(user) {
    for (const { seedId, ...video } of videos) {
        // Deterministic ID so running this twice never creates duplicates.
        const ref = doc(db, 'videos', seedId);

        try {
            if ((await getDoc(ref)).exists()) {
                console.log(`Skipped "${video.title}" (already uploaded)`);
                continue;
            }

            await setDoc(ref, {
                user_id: user.uid,
                // Firestore rejects `undefined`, so only include username if there is one.
                ...(user.displayName ? { username: user.displayName } : {}),
                ...video,
                liked_by: [],
                like_count: 0,
                created_at: serverTimestamp(),
            });

            console.log(`Uploaded "${video.title}" as ${seedId}`);
        } catch (error) {
            console.error(`Failed to upload "${video.title}":`, error);
        }
    }
}

// Wait for Firebase Auth to finish restoring the session (auth.currentUser
// is null on first load even for signed-in users), then act once.
const unsubscribe = onAuthStateChanged(auth, (user) => {
    unsubscribe();
    if (!user) return; // not signed in: do nothing
    uploadVideos(user);
});