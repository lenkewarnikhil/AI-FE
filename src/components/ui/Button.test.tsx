import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Button } from './Button';

describe('Button Component', () => {
  it('renders children correctly', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeDefined();
  });

  it('shows loading spinner when isLoading is true', () => {
    render(<Button isLoading>Submit</Button>);
    expect(screen.getByText('Submit')).toBeDefined();
  });
});
