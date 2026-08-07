import { configureStore } from '@reduxjs/toolkit';
import strategyReducer from './strategySlice.js';
import postReducer from './postSlice.js';
import commentReducer from './commentSlice.js';

export const store = configureStore({
  reducer: {
    strategies: strategyReducer,
    posts: postReducer,
    comments: commentReducer,
  },
});
