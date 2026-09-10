import { Transform } from 'class-transformer';

export function ParseBoolean() {
  return Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  });
}
