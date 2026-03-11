let counter = 0;

export function getUniqueFilename(originalFilename: string): string {
  counter += 1;
  const dot = originalFilename.lastIndexOf('.');
  if (dot === -1) {
    return `${counter}-${originalFilename}`;
  }
  const name = originalFilename.substring(0, dot);
  const ext = originalFilename.substring(dot);
  return `${counter}-${name}${ext}`;
}
