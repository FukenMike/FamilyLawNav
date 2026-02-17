# DEV_NOTES.md

## Rork Vendor Lock Removal & Migration Notes

This project was migrated to remove all Rork vendor lock-in and branding. Key changes:

1. **Scripts**: All npm scripts now use Expo CLI. Rork-specific scripts and tunnel/project IDs were removed.
2. **Branding**: iOS and Android identifiers in app.json now use neutral org.fathersalliance.familylawnavigator values. Rork plugin origin removed.
3. **AI Endpoint**: The AI service endpoint is now configurable via the `EXPO_PUBLIC_LLM_ENDPOINT` environment variable. See `.env.example` for setup. The code throws a clear error if this is missing.
4. **Icons**: All `lucide-react-native` icons were replaced with Feather icons from `@expo/vector-icons` (Expo standard). No new libraries were added.
5. **Dependencies**: The `lucide-react-native` dependency was removed to avoid React 19 peer conflicts. No downgrades to Expo, React, or React Native were made.
6. **Syntax Fixes**: Generator artifacts like `/import` were fixed, and all TypeScript/ESM imports are now valid. `colors.ts` and `searchStore.ts` were fixed for proper exports/imports.
7. **Verification**: The project should now install and run with standard Expo commands (`npm install`, `npm run start`).

No Rork URLs, scripts, or branding remain in the codebase. For any AI features, set your endpoint in `.env` as described above.
