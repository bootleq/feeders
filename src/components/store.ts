"use client"

import * as R from 'ramda';
import { atom, useAtom, useSetAtom, useAtomValue } from 'jotai';
import { ReactElement } from 'react';
import { nanoid } from 'nanoid';

import { WorldUserResult } from '@/models/users';
import { rejectFirst } from '@/lib/utils';

export const AREA_PICKER_MIN_ZOOM = 14;

export const userAtom = atom<WorldUserResult | null>(null);
export const navTitleAtom = atom('');

export type keyedAlert = [string, 'info' | 'error', ReactElement];
export const alertsAtom = atom<keyedAlert[]>([]);
export const addAlertAtom = atom(
  null,
  (get, set, type: 'info' | 'error', node: ReactElement) => set(alertsAtom, (errors) => [...errors, [nanoid(6), type, node]])
)
export const dismissAlertAtom = atom(null, (get, set, key: string) => set(alertsAtom, rejectFirst(R.eqBy(R.head, [key]))));

export const linkPreviewUrlAtom = atom<string | null>(null);
