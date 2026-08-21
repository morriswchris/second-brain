import { render, screen } from '@testing-library/react-native';

import { ThemedText } from '@/components/themed-text';

// NOTE: In React Native Testing Library v14+, `render` is async (it awaits
// React's `act`), so tests must `await` it before querying the screen.
describe('ThemedText', () => {
  it('renders its children', async () => {
    await render(<ThemedText>Second Brain</ThemedText>);

    expect(screen.getByText('Second Brain')).toBeOnTheScreen();
  });

  it('applies the title type styles', async () => {
    await render(<ThemedText type="title">Heading</ThemedText>);

    const node = screen.getByText('Heading');
    const flattened = Array.isArray(node.props.style)
      ? Object.assign({}, ...node.props.style.filter(Boolean))
      : node.props.style;

    expect(flattened.fontSize).toBe(48);
  });
});
