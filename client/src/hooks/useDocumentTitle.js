import { useEffect } from 'react';

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | AAVASA` : 'AAVASA | A Stay That Feels Like Home';
  }, [title]);
}

// Default export alias so pages can use either import style
export default useDocumentTitle;
