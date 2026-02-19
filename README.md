# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.


## Features

- **Navigator Tab**: A triage-first legal navigator is available as a tab, allowing users to answer intake questions and see detected issues, legal authorities, and references.
- **Authority Details Navigation**: Tapping an authority citation in the Navigator tab navigates to a details screen, showing metadata and referenced issues for that authority.
- **Strict TypeScript**: The project enforces strict TypeScript settings and minimal-diff policy for maintainability and reliability.

## Architecture

- **Navigator logic**: See `app/(tabs)/navigator.tsx` for the main navigator UI and logic.
- **Authority details**: See `app/resource/[id].tsx` for the authority details screen, which decodes the citation and loads metadata.
- **Authority ID helpers**: See `services/authorityIdHelpers.ts` for encoding/decoding authority citations for navigation.
- **State packs**: Authority and domain data are defined in `data/statePacks/ga.ts`.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
