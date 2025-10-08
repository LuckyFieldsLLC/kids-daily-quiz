import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import LevelSelector from '../../components/LevelSelector';

// Helper to build numeric options
const buildOptions = (count: number) => {
  const opts: { [key: number]: string } = {};
  for (let i = 1; i <= count; i++) {
    opts[i] = `レベル${i}`;
  }
  return opts;
};

describe('LevelSelector', () => {
  test('選択済みの値に aria-checked=true が付きクリックで変更される', () => {
    const handleChange = vi.fn();
    const options = buildOptions(3);

    const { rerender } = render(
      <LevelSelector
        label="難易度"
        name="difficulty"
        options={options}
        selectedValue={2}
        onChange={handleChange}
      />
    );

    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(3);

    // initial selection
    expect(radios[0]).toHaveAttribute('aria-checked', 'false');
    expect(radios[1]).toHaveAttribute('aria-checked', 'true');
    expect(radios[2]).toHaveAttribute('aria-checked', 'false');

    // click first button
    fireEvent.click(radios[0]);
    expect(handleChange).toHaveBeenCalledWith(1);

    // simulate parent updating selectedValue
    rerender(
      <LevelSelector
        label="難易度"
        name="difficulty"
        options={options}
        selectedValue={1}
        onChange={handleChange}
      />
    );

    const updatedRadios = screen.getAllByRole('radio');
    expect(updatedRadios[0]).toHaveAttribute('aria-checked', 'true');
    expect(updatedRadios[1]).toHaveAttribute('aria-checked', 'false');
  });

  test('radiogroup として適切な role が設定されている', () => {
    render(
      <LevelSelector
        label="楽しさ"
        name="fun_level"
        options={{ 1: '低', 2: '中', 3: '高' }}
        selectedValue={3}
        onChange={() => {}}
      />
    );

    // group
    const group = screen.getByRole('radiogroup');
    expect(group).toBeInTheDocument();

    // radios
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(3);
    // selected value 3
    expect(radios[2]).toHaveAttribute('aria-checked', 'true');
  });
});
