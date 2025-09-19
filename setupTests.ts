import { expect } from 'vitest';

// Ensure Vitest's expect is visible to jest-dom when extending
(globalThis as typeof globalThis & { expect: typeof expect }).expect = expect;

import '@testing-library/jest-dom';

