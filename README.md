# CropQuery Mobile

Expo/React Native frontend for CropQuery — an AI crop disease diagnosis
assistant for Indian farmers. Multilingual (11 languages), photo-based
diagnosis, treatment advisory, and farmer Q&A.

## Backend
This app talks to the CropQuery backend (LLaVA-Next + FAISS + RAG pipeline):
https://github.com/Vitthal-Jauhari/CropQuery

## Stack
Expo Router, React Native, TypeScript

## Running locally
1. `npm install`
2. Set `EXPO_PUBLIC_*` variables in `.env` (see `.env.example`)
3. `npx expo start`
