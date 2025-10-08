import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import HelpModal from '../../components/HelpModal';

// Mock fetch for QA ask
const mockFetch = (ok: boolean, answer?: string) => {
  // @ts-ignore
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    json: async () => ok ? { answer } : { error: '失敗しました' }
  });
};

describe('HelpModal', () => {
  test('タイトルと説明が表示される', () => {
    const onClose = vi.fn();
    render(<HelpModal onClose={onClose} />);
    expect(screen.getByRole('heading', { name: 'ヘルプ / このアプリについて' })).toBeInTheDocument();
    expect(screen.getByText('アプリの機能説明とトラブルシュートガイド')).toBeInTheDocument();
  });

  test('質問入力→送信成功で履歴表示 & 入力クリア', async () => {
    mockFetch(true, 'これは回答です');
    render(<HelpModal onClose={() => {}} />);
    const input = screen.getByLabelText('ヘルプ質問入力');
    fireEvent.change(input, { target: { value: 'どうやって保存しますか?' } });
    fireEvent.click(screen.getByRole('button', { name: '質問する' }));

    await screen.findByText(/これは回答です/);
    expect(input).toHaveValue('');
  });

  test('質問送信失敗でエラーメッセージ表示', async () => {
    mockFetch(false);
    render(<HelpModal onClose={() => {}} />);
    const input = screen.getByLabelText('ヘルプ質問入力');
    fireEvent.change(input, { target: { value: '失敗テスト' } });
    fireEvent.click(screen.getByRole('button', { name: '質問する' }));

    await screen.findByText('失敗しました');
  });

  test('Esc キーで閉じる (onClose 呼び出し)', () => {
    const onClose = vi.fn();
    render(<HelpModal onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    // Radix Dialog は Escape で閉じる ⇒ onOpenChange(false) 経由で onClose 呼ばれる設計
    expect(onClose).toHaveBeenCalled();
  });
});
