import { useEffect, useState } from 'react';

/**
 * useDelayedUnmount
 * 真偽値のisMountedを受け取り、unmount時に一定時間(デフォルト200ms)要素を残すためのフラグを返す。
 * CSS側で .modal-exit クラスを付与してフェードアウト/スケールアウトを実行させる想定。
 */
export function useDelayedUnmount(isMounted: boolean, delay = 200) {
  const [shouldRender, setShouldRender] = useState(isMounted);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (isMounted) {
      setShouldRender(true);
      setExiting(false);
    } else if (shouldRender) {
      setExiting(true);
      const t = setTimeout(() => {
        setShouldRender(false);
        setExiting(false);
      }, delay);
      return () => clearTimeout(t);
    }
  }, [isMounted, delay, shouldRender]);

  return { shouldRender, exiting } as const;
}

interface DelayedUnmountProps {
  isOpen: boolean;
  delay?: number;
  /**
   * childrenは関数形式で受け取り、exiting状態を渡してクラス付与を委譲できるようにする。
   */
  children: (exiting: boolean) => React.ReactNode;
}

export const DelayedUnmount: React.FC<DelayedUnmountProps> = ({ isOpen, delay = 200, children }) => {
  const { shouldRender, exiting } = useDelayedUnmount(isOpen, delay);
  if (!shouldRender) return null;
  return <>{children(exiting)}</>;
};
