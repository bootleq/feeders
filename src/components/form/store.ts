import { atom } from 'jotai';

export type FieldErrors = {
  [key: string]: string[]
}

export const errorsAtom = atom<FieldErrors>({});
export const metaAtom = atom({
  fieldNameScope: '',
});
