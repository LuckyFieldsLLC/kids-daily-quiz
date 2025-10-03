declare module '@netlify/blobs' {
  interface SetOptions {
    type?: 'json' | 'text' | 'bytes';
  }

  interface GetOptions {
    type?: 'json' | 'text' | 'bytes';
  }
}
