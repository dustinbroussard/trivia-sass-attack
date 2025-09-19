import React, { useEffect, useMemo, useState } from 'react';
import { nanoid } from 'nanoid';
import { TriviaCategories, TriviaCategory, Tone, PersonalityFlags } from '@/types/trivia';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

export type Settings = {
  category: TriviaCategory;
  difficulty: 'easy' | 'medium' | 'hard';
  tone: Tone;
  seed?: string;
  flags: PersonalityFlags;
};

type Props = {
  value: Settings;
  onChange: (v: Settings) => void;
  onNewQuestion?: () => void;
  onRemix?: () => void;
};

export default function ControlsBar({ value, onChange, onNewQuestion, onRemix }: Props) {
  const [seedInput, setSeedInput] = useState(value.seed || '');

  useEffect(() => setSeedInput(value.seed || ''), [value.seed]);

  const set = (patch: Partial<Settings>) => {
    const next = { ...value, ...patch };
    onChange(next);
  };

  const categories = useMemo(() => TriviaCategories, []);

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-5 gap-3">
      <div>
        <label className="text-xs text-gray-400">Category</label>
        <Select value={value.category} onValueChange={(v) => set({ category: v as TriviaCategory })}>
          <SelectTrigger>
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{c.replace('_', ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-xs text-gray-400">Difficulty</label>
        <Select value={value.difficulty} onValueChange={(v) => set({ difficulty: v as Settings['difficulty'] })}>
          <SelectTrigger>
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="easy">easy</SelectItem>
            <SelectItem value="medium">medium</SelectItem>
            <SelectItem value="hard">hard</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-xs text-gray-400">Tone</label>
        <Select value={value.tone} onValueChange={(v) => set({ tone: v as Tone })}>
          <SelectTrigger>
            <SelectValue placeholder="Tone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="snark">snark</SelectItem>
            <SelectItem value="deadpan">deadpan</SelectItem>
            <SelectItem value="professor">professor</SelectItem>
            <SelectItem value="roast-lite">roast-lite</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-xs text-gray-400">Seed (optional)</label>
        <div className="flex gap-2">
          <Input
            value={seedInput}
            onChange={(e) => setSeedInput(e.target.value)}
            onBlur={() => set({ seed: seedInput || undefined })}
            placeholder="auto"
          />
          <Button variant="outline" onClick={() => { const s = nanoid(); setSeedInput(s); set({ seed: s }); }}>🎲</Button>
        </div>
      </div>

      <div className="flex items-end gap-2 justify-end">
        <Button onClick={onNewQuestion} className="bg-cyan-600 hover:bg-cyan-500">New Question</Button>
        <Button onClick={onRemix} variant="secondary">Remix</Button>
      </div>

      <div className="md:col-span-5 grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
        <label className="flex items-center gap-2"><Switch checked={value.flags.pg13Snark} onCheckedChange={(v) => set({ flags: { ...value.flags, pg13Snark: v } })} /> PG-13 snark</label>
        <label className="flex items-center gap-2"><Switch checked={value.flags.noPolitics} onCheckedChange={(v) => set({ flags: { ...value.flags, noPolitics: v } })} /> No politics</label>
        <label className="flex items-center gap-2"><Switch checked={value.flags.allowLightInnuendo} onCheckedChange={(v) => set({ flags: { ...value.flags, allowLightInnuendo: v } })} /> Allow light innuendo</label>
        <label className="flex items-center gap-2 opacity-70 cursor-not-allowed"><Switch checked={true} disabled /> Keep it kind</label>
      </div>
    </div>
  );
}

