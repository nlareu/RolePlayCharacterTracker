import * as React from "react";
import { useState, useEffect } from "react";
import {
  Shield,
  Zap,
  Sword,
  Heart,
  Plus,
  Minus,
  RotateCcw,
  Star,
  Trash2,
  Info,
  Settings2,
  ChevronUp,
  ChevronDown,
  Edit2,
  Menu,
  Languages,
  Settings,
  Users,
  UserPlus,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CharacterState, SpellSlot, Ability, HitDice, Buff } from "../types";
import { translations, Language } from "../translations";

const INITIAL_STATE: CharacterState = {
  id: "default",
  name: "Aventurero",
  hp: { current: 25, max: 25, temp: 0 },
  inspiration: false,
  spellSlots: [
    { level: 1, total: 4, used: 0 },
    { level: 2, total: 3, used: 0 },
    { level: 3, total: 2, used: 0 },
  ],
  hitDice: [{ id: "default-hd", dieType: "d8", total: 5, used: 0 }],
  abilities: [],
  buffs: [],
  preparedSpells: [],
};

export function Tracker() {
  const [characters, setCharacters] = useState<CharacterState[]>(() => {
    const saved = localStorage.getItem("dnd_tracker_characters");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const seenIds = new Set();
          return parsed
            .filter((char) => {
              if (!char.id || seenIds.has(char.id)) return false;
              seenIds.add(char.id);
              return true;
            })
            .map((char) => ({
              ...INITIAL_STATE,
              ...char,
              // Deduplicate spell slots just in case
              spellSlots: char.spellSlots
                ? char.spellSlots.filter(
                    (s: SpellSlot, i: number, self: SpellSlot[]) =>
                      self.findIndex((t) => t.level === s.level) === i,
                  )
                : INITIAL_STATE.spellSlots,
              // Ensure hit dice have IDs
              hitDice: char.hitDice
                ? char.hitDice.map((hd, i) => ({
                    ...hd,
                    id: hd.id || `hd-${i}`,
                  }))
                : INITIAL_STATE.hitDice,
            }));
        }
      } catch (e) {
        console.error("Failed to parse characters", e);
      }
    }
    // Fallback to legacy single character state if it exists
    const legacy = localStorage.getItem("dnd_character_state");
    if (legacy) {
      try {
        const parsed = JSON.parse(legacy);
        const char = {
          ...INITIAL_STATE,
          ...parsed,
          id: parsed.id || "legacy",
          spellSlots: parsed.spellSlots
            ? parsed.spellSlots.filter(
                (s: SpellSlot, i: number, self: SpellSlot[]) =>
                  self.findIndex((t) => t.level === s.level) === i,
              )
            : INITIAL_STATE.spellSlots,
          hitDice: parsed.hitDice
            ? parsed.hitDice.map((hd: any, i: number) => ({
                ...hd,
                id: hd.id || `hd-${i}`,
              }))
            : INITIAL_STATE.hitDice,
        };
        return [char];
      } catch (e) {
        console.error("Failed to parse legacy character", e);
      }
    }
    return [
      {
        ...INITIAL_STATE,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      },
    ];
  });

  const [activeCharacterId, setActiveCharacterId] = useState<string>(() => {
    const saved = localStorage.getItem("dnd_tracker_active_id");
    if (saved && characters.some((c) => c.id === saved)) {
      return saved;
    }
    return characters[0]?.id || "default";
  });

  const state =
    characters.find((c) => c.id === activeCharacterId) ||
    characters[0] ||
    INITIAL_STATE;

  const setState = (updater: (prev: CharacterState) => CharacterState) => {
    setCharacters((prev) =>
      prev.map((c) => (c.id === activeCharacterId ? updater(c) : c)),
    );
  };

  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [newName, setNewName] = useState(state.name);
  const [isAddBuffOpen, setIsAddBuffOpen] = useState(false);
  const [newBuffName, setNewBuffName] = useState("");
  const [newBuffDescription, setNewBuffDescription] = useState("");
  const [isAddAbilityOpen, setIsAddAbilityOpen] = useState(false);
  const [newAbilityName, setNewAbilityName] = useState("");
  const [newAbilityDescription, setNewAbilityDescription] = useState("");
  const [isAddSpellOpen, setIsAddSpellOpen] = useState(false);
  const [newSpellName, setNewSpellName] = useState("");
  const [isEditingSpellSlots, setIsEditingSpellSlots] = useState(false);
  const [isEditingHitDice, setIsEditingHitDice] = useState(false);
  const [isEditingAbilities, setIsEditingAbilities] = useState(false);
  const [newSpellLevel, setNewSpellLevel] = useState(
    state.spellSlots.length > 0
      ? Math.max(...state.spellSlots.map((s) => s.level)) + 1
      : 1,
  );

  // Sync local state when character changes
  useEffect(() => {
    setNewName(state.name);
    setNewSpellLevel(
      state.spellSlots.length > 0
        ? Math.max(...state.spellSlots.map((s) => s.level)) + 1
        : 1,
    );
  }, [activeCharacterId, state.name, state.spellSlots]);
  const [newAbilityTotal, setNewAbilityTotal] = useState(1);
  const [newAbilityResetOn, setNewAbilityResetOn] = useState<"short" | "long">(
    "short",
  );
  const [selectedAbility, setSelectedAbility] = useState<Ability | null>(null);
  const [selectedBuff, setSelectedBuff] = useState<Buff | null>(null);
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem("dnd_tracker_lang");
    return (saved as Language) || "es";
  });

  const t = translations[lang];

  useEffect(() => {
    localStorage.setItem("dnd_tracker_lang", lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem("dnd_tracker_characters", JSON.stringify(characters));
  }, [characters]);

  useEffect(() => {
    localStorage.setItem("dnd_tracker_active_id", activeCharacterId);
  }, [activeCharacterId]);

  const createNewCharacter = () => {
    const newChar = {
      ...INITIAL_STATE,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: t.newCharacter,
    };
    setCharacters((prev) => [...prev, newChar]);
    setActiveCharacterId(newChar.id);
  };

  const deleteCharacter = (id: string) => {
    if (characters.length <= 1) return;
    setCharacters((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      if (activeCharacterId === id) {
        setActiveCharacterId(filtered[0].id);
      }
      return filtered;
    });
  };

  const updateHP = (amount: number) => {
    setState((prev) => {
      let newCurrent = prev.hp.current + amount;
      if (newCurrent > prev.hp.max) newCurrent = prev.hp.max;
      if (newCurrent < 0) newCurrent = 0;
      return { ...prev, hp: { ...prev.hp, current: newCurrent } };
    });
  };

  const updateTempHP = (amount: number) => {
    setState((prev) => ({
      ...prev,
      hp: { ...prev.hp, temp: Math.max(0, prev.hp.temp + amount) },
    }));
  };

  const toggleSpellSlot = (level: number, index: number) => {
    setState((prev) => ({
      ...prev,
      spellSlots: prev.spellSlots.map((slot) =>
        slot.level === level
          ? { ...slot, used: index < slot.used ? index : index + 1 }
          : slot,
      ),
    }));
  };

  const updateSpellSlotTotal = (level: number, delta: number) => {
    setState((prev) => ({
      ...prev,
      spellSlots: prev.spellSlots.map((s) => {
        if (s.level === level) {
          const newTotal = Math.max(0, s.total + delta);
          return { ...s, total: newTotal, used: Math.min(s.used, newTotal) };
        }
        return s;
      }),
    }));
  };

  const addSpellLevel = () => {
    if (state.spellSlots.some((s) => s.level === newSpellLevel)) return;
    setState((prev) => ({
      ...prev,
      spellSlots: [
        ...prev.spellSlots,
        { level: newSpellLevel, total: 1, used: 0 },
      ].sort((a, b) => a.level - b.level),
    }));
    setNewSpellLevel((prev) => prev + 1);
  };

  const removeSpellLevel = (level: number) => {
    setState((prev) => ({
      ...prev,
      spellSlots: prev.spellSlots.filter((s) => s.level !== level),
    }));
  };

  const toggleAbility = (id: string, index: number) => {
    setState((prev) => ({
      ...prev,
      abilities: prev.abilities.map((a) =>
        a.id === id ? { ...a, used: index < a.used ? index : index + 1 } : a,
      ),
    }));
  };

  const togglePreparedSpell = (id: string) => {
    setState((prev) => ({
      ...prev,
      preparedSpells: prev.preparedSpells.map((s) =>
        s.id === id ? { ...s, used: !s.used } : s,
      ),
    }));
  };

  const toggleBuff = (id: string) => {
    setState((prev) => ({
      ...prev,
      buffs: prev.buffs.map((b) =>
        b.id === id ? { ...b, active: !b.active } : b,
      ),
    }));
  };

  const resetShortRest = () => {
    setState((prev) => ({
      ...prev,
      abilities: prev.abilities.map((a) =>
        a.resetOn === "short" ? { ...a, used: 0 } : a,
      ),
    }));
  };

  const resetLongRest = () => {
    setState((prev) => ({
      ...prev,
      hp: { ...prev.hp, current: prev.hp.max },
      spellSlots: prev.spellSlots.map((s) => ({ ...s, used: 0 })),
      abilities: prev.abilities.map((a) => ({ ...a, used: 0 })),
      hitDice: prev.hitDice.map((hd) => ({
        ...hd,
        used: Math.max(0, hd.used - Math.floor(hd.total / 2)),
      })),
      preparedSpells: prev.preparedSpells.map((s) => ({ ...s, used: false })),
    }));
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0 max-w-[70%]">
          <Sheet>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="shrink-0" />
              }
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] sm:w-[350px]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  {t.settings}
                </SheetTitle>
                <SheetDescription>{t.characterTracker}</SheetDescription>
              </SheetHeader>

              <div className="flex flex-col gap-6 py-6 px-4">
                {/* Character Selection */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {t.characters}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={createNewCharacter}
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                    {characters.map((char) => (
                      <div
                        key={char.id}
                        className="flex items-center gap-2 group"
                      >
                        <Button
                          variant={
                            activeCharacterId === char.id
                              ? "secondary"
                              : "ghost"
                          }
                          className={`flex-1 justify-start gap-2 h-9 text-xs ${activeCharacterId === char.id ? "bg-primary/10 text-primary border border-primary/20" : ""}`}
                          onClick={() => setActiveCharacterId(char.id)}
                        >
                          <div
                            className={`h-2 w-2 rounded-full ${activeCharacterId === char.id ? "bg-primary" : "bg-muted-foreground/30"}`}
                          />
                          <span className="truncate">{char.name}</span>
                          {activeCharacterId === char.id && (
                            <Check className="h-3 w-3 ml-auto shrink-0" />
                          )}
                        </Button>
                        {characters.length > 1 && (
                          <AlertDialog>
                            <AlertDialogTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              }
                            />
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {t.confirmDeleteChar}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t.confirmDeleteCharDesc}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel
                                  variant="outline"
                                  size="default"
                                >
                                  {t.cancel}
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  variant="default"
                                  size="default"
                                  onClick={() => deleteCharacter(char.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {t.deleteCharacter}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Language Selection */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Languages className="h-4 w-4" />
                    {t.language}
                  </div>
                  <div className="flex items-center bg-secondary/30 rounded-lg p-1 border border-border/50">
                    <button
                      onClick={() => setLang("en")}
                      className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${lang === "en" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-primary"}`}
                    >
                      ENGLISH
                    </button>
                    <button
                      onClick={() => setLang("es")}
                      className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${lang === "es" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-primary"}`}
                    >
                      ESPAÑOL
                    </button>
                  </div>
                </div>

                <Separator />

                {/* Rename Character */}
                <div className="space-y-3">
                  <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
                    <DialogTrigger
                      render={
                        <Button
                          variant="outline"
                          className="w-full justify-start gap-2 h-11"
                        >
                          <Edit2 className="h-4 w-4" />
                          {t.rename}
                        </Button>
                      }
                    />
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>{t.rename}</DialogTitle>
                        <DialogDescription>{t.enterName}</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="name">{t.name}</Label>
                          <Input
                            id="name"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="col-span-3"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <DialogClose
                          render={
                            <Button
                              variant="default"
                              size="default"
                              onClick={() => {
                                if (newName) {
                                  setState((prev) => ({
                                    ...prev,
                                    name: newName,
                                  }));
                                }
                              }}
                            />
                          }
                        >
                          {t.saveChanges}
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <Separator />

                {/* Reset Data */}
                <div className="mt-auto pt-4">
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-2 h-11 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                          {t.resetData}
                        </Button>
                      }
                    />
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t.confirmReset}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t.confirmResetDesc}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel variant="outline" size="default">
                          {t.cancel}
                        </AlertDialogCancel>
                        <AlertDialogAction
                          variant="default"
                          size="default"
                          onClick={() => setState(() => INITIAL_STATE)}
                        >
                          {t.reset}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex flex-col min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-primary truncate">
              {state.name}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button variant="outline" size="icon" title={t.longRest} />
              }
            >
              <RotateCcw className="h-4 w-4" />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t.confirmLongRest}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t.confirmLongRestDesc}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel variant="outline" size="default">
                  {t.cancel}
                </AlertDialogCancel>
                <AlertDialogAction
                  variant="default"
                  size="default"
                  onClick={resetLongRest}
                >
                  {t.longRest}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-full border border-border">
            <div className="flex items-center gap-1.5">
              <Star
                className={`h-4 w-4 ${state.inspiration ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"}`}
              />
              <span className="text-[10px] uppercase font-bold tracking-tighter text-muted-foreground">
                {t.inspiration}
              </span>
            </div>
            <Switch
              checked={state.inspiration}
              onCheckedChange={(val) =>
                setState((prev) => ({ ...prev, inspiration: val }))
              }
            />
          </div>
        </div>
      </header>

      <Tabs defaultValue="combat" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-12">
          <TabsTrigger value="combat" className="flex items-center gap-2">
            <Sword className="h-4 w-4" />
            <span className="hidden sm:inline">{t.combat}</span>
          </TabsTrigger>
          <TabsTrigger value="magic" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">{t.magic}</span>
          </TabsTrigger>
          <TabsTrigger value="abilities" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">{t.abilities}</span>
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <TabsContent value="combat" className="mt-4 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card className="border-2 border-primary/20 bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-end">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Heart className="h-5 w-5 text-red-500" />
                      {t.hpLong}
                    </CardTitle>
                    <div className="text-right">
                      <span className="text-3xl font-bold font-mono">
                        {state.hp.current}
                      </span>
                      <span className="text-muted-foreground font-mono">
                        {" "}
                        / {state.hp.max}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Progress
                      value={(state.hp.current / state.hp.max) * 100}
                      className="h-3 bg-secondary"
                    />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-400 font-medium">
                        {t.tempHp}
                      </span>
                      <span className="font-mono font-bold">
                        +{state.hp.temp}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-1">
                    <Label className="text-xs uppercase text-muted-foreground tracking-wider">
                      {t.max} {t.hp}
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={state.hp.max}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val))
                            setState((prev) => ({
                              ...prev,
                              hp: { ...prev.hp, max: val },
                            }));
                        }}
                        className="h-8 w-24 text-center font-mono"
                      />
                    </div>
                  </div>

                  {state.hp.current === 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-destructive tracking-widest">
                          {t.deathSaves}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px]"
                          onClick={() => updateHP(1)}
                        >
                          {t.stabilized}
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase text-muted-foreground">
                            {t.successes}
                          </p>
                          <div className="flex gap-2">
                            {[1, 2, 3].map((i) => (
                              <div
                                key={`success-${i}`}
                                className="h-4 w-4 rounded-full border border-green-500/50 bg-green-500/10"
                              />
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase text-muted-foreground">
                            {t.failures}
                          </p>
                          <div className="flex gap-2">
                            {[1, 2, 3].map((i) => (
                              <div
                                key={`failure-${i}`}
                                className="h-4 w-4 rounded-full border border-red-500/50 bg-red-500/10"
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase text-muted-foreground tracking-wider">
                        {t.current} {t.hp}
                      </Label>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-10 w-10 shrink-0"
                          onClick={() => updateHP(-1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          className="h-10 text-center font-mono text-sm px-1"
                          placeholder={t.amount}
                          value="1"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const val = parseInt(
                                (e.target as HTMLInputElement).value,
                              );
                              if (!isNaN(val)) updateHP(val);
                              (e.target as HTMLInputElement).value = "";
                            }
                          }}
                        />
                        <Button
                          variant="default"
                          size="icon"
                          className="h-10 w-10 shrink-0 bg-green-600 hover:bg-green-700"
                          onClick={() => updateHP(1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase text-muted-foreground tracking-wider">
                        {t.tempHp}
                      </Label>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 shrink-0"
                          onClick={() => updateTempHP(-1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          className="h-10 text-center font-mono text-sm px-1"
                          placeholder={t.amount}
                          value="1"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const val = parseInt(
                                (e.target as HTMLInputElement).value,
                              );
                              if (!isNaN(val)) updateTempHP(val);
                              (e.target as HTMLInputElement).value = "";
                            }
                          }}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 shrink-0"
                          onClick={() => updateTempHP(1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-4 border-border bg-card/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">
                    {t.buffs}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {state.buffs.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic text-center py-4">
                      {t.noBuffs}
                    </p>
                  ) : (
                    state.buffs.map((buff) => (
                      <div
                        key={buff.id}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${buff.active ? "bg-secondary/30 border-border/50" : "bg-muted/20 border-transparent opacity-60"}`}
                      >
                        <div className="min-w-0 flex-1 mr-2">
                          <p
                            className={`font-medium text-sm truncate ${!buff.active ? "text-muted-foreground line-through" : ""}`}
                          >
                            {buff.name}
                          </p>
                          {buff.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {buff.description}
                              {buff.description.length > 40 && (
                                <button
                                  onClick={() => setSelectedBuff(buff)}
                                  className="ml-1 text-primary hover:underline font-medium"
                                >
                                  ...
                                </button>
                              )}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleBuff(buff.id)}
                            className={`
                              h-7 w-7 rounded-md border-2 transition-all duration-200 flex items-center justify-center
                              ${
                                !buff.active
                                  ? "bg-muted border-muted-foreground/30 text-muted-foreground"
                                  : "bg-primary/10 border-primary text-primary shadow-[0_0_8px_rgba(var(--primary),0.2)]"
                              }
                              hover:scale-110 active:scale-95
                            `}
                          >
                            {!buff.active ? null : (
                              <div className="h-2 w-2 rounded-full bg-primary" />
                            )}
                          </button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                            onClick={() =>
                              setState((prev) => ({
                                ...prev,
                                buffs: prev.buffs.filter(
                                  (b) => b.id !== buff.id,
                                ),
                              }))
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                  <Dialog open={isAddBuffOpen} onOpenChange={setIsAddBuffOpen}>
                    <DialogTrigger
                      render={
                        <Button
                          variant="outline"
                          className="w-full border-dashed"
                        />
                      }
                    >
                      <Plus className="h-4 w-4 mr-2" /> {t.addBuff}
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>{t.addBuff}</DialogTitle>
                        <DialogDescription>{t.buffDesc}</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="buff-name">{t.name}</Label>
                          <Input
                            id="buff-name"
                            value={newBuffName}
                            onChange={(e) => setNewBuffName(e.target.value)}
                            placeholder="e.g. Bless, Haste"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="buff-description">
                            {t.description}
                          </Label>
                          <Input
                            id="buff-description"
                            value={newBuffDescription}
                            onChange={(e) =>
                              setNewBuffDescription(e.target.value)
                            }
                            placeholder={t.descriptionPlaceholder}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <DialogClose
                          render={
                            <Button
                              variant="default"
                              size="default"
                              onClick={() => {
                                if (newBuffName) {
                                  setState((prev) => ({
                                    ...prev,
                                    buffs: [
                                      ...prev.buffs,
                                      {
                                        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                        name: newBuffName,
                                        description: newBuffDescription,
                                        active: true,
                                      },
                                    ],
                                  }));
                                  setNewBuffName("");
                                  setNewBuffDescription("");
                                }
                              }}
                            />
                          }
                        >
                          {t.addBuff}
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="magic" className="mt-4 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  {t.spellcasting}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingSpellSlots(!isEditingSpellSlots)}
                  className={`h-8 text-xs gap-1 ${isEditingSpellSlots ? "text-primary bg-primary/10" : ""}`}
                >
                  <Settings2 className="h-3 w-3" />{" "}
                  {isEditingSpellSlots ? t.doneEditing : t.editSlots}
                </Button>
              </div>

              {state.spellSlots.map((slot) => (
                <Card
                  key={slot.level}
                  className="bg-card/40 border-primary/10 relative group"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">
                          {t.level} {slot.level}
                        </Badge>
                        <span className="text-sm font-medium">
                          {t.spellSlots}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {isEditingSpellSlots ? (
                          <div className="flex items-center gap-2 bg-secondary/30 rounded-md px-1 py-0.5 border border-border/50">
                            <button
                              onClick={() =>
                                updateSpellSlotTotal(slot.level, -1)
                              }
                              className="p-1 hover:text-primary transition-colors"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-xs font-mono font-bold w-4 text-center">
                              {slot.total}
                            </span>
                            <button
                              onClick={() =>
                                updateSpellSlotTotal(slot.level, 1)
                              }
                              className="p-1 hover:text-primary transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                            <Separator
                              orientation="vertical"
                              className="h-3 mx-1"
                            />
                            <button
                              onClick={() => removeSpellLevel(slot.level)}
                              className="p-1 hover:text-destructive transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-mono text-muted-foreground">
                            {slot.total - slot.used} / {slot.total}{" "}
                            {t.available}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {slot.total === 0 && isEditingSpellSlots && (
                        <p className="text-[10px] text-muted-foreground italic">
                          {t.noSlots}
                        </p>
                      )}
                      {Array.from({ length: slot.total }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() =>
                            !isEditingSpellSlots &&
                            toggleSpellSlot(slot.level, i)
                          }
                          disabled={isEditingSpellSlots}
                          className={`
                            h-10 w-10 rounded-md border-2 transition-all duration-200 flex items-center justify-center
                            ${
                              i < slot.used
                                ? "bg-muted border-muted-foreground/30 text-muted-foreground"
                                : "bg-primary/10 border-primary text-primary shadow-[0_0_10px_rgba(var(--primary),0.2)]"
                            }
                            ${isEditingSpellSlots ? "opacity-50 cursor-default" : "hover:scale-105 active:scale-95"}
                          `}
                        >
                          {i < slot.used ? (
                            <Minus className="h-4 w-4" />
                          ) : (
                            <Zap className="h-4 w-4 fill-primary" />
                          )}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {isEditingSpellSlots && (
                <Card className="bg-card/20 border-dashed border-primary/20">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Label
                        htmlFor="new-spell-level"
                        className="text-xs text-muted-foreground"
                      >
                        {t.newLevel}:
                      </Label>
                      <Input
                        id="new-spell-level"
                        type="number"
                        value={newSpellLevel}
                        onChange={(e) =>
                          setNewSpellLevel(parseInt(e.target.value) || 1)
                        }
                        className="h-8 w-16 text-xs font-mono"
                        min="1"
                        max="9"
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={addSpellLevel}
                      className="h-8 gap-1"
                    >
                      <Plus className="h-3 w-3" /> {t.addLevel}
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Separator className="my-6" />

              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  {t.alwaysPreparedSpells}
                </h3>
                <Dialog open={isAddSpellOpen} onOpenChange={setIsAddSpellOpen}>
                  <DialogTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        title={t.addSpell}
                      />
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>{t.addSpell}</DialogTitle>
                      <DialogDescription>{t.abilityDesc}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="spell-name">{t.name}</Label>
                        <Input
                          id="spell-name"
                          value={newSpellName}
                          onChange={(e) => setNewSpellName(e.target.value)}
                          placeholder="e.g. Fire Bolt, Cure Wounds"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose
                        render={
                          <Button
                            variant="default"
                            size="default"
                            onClick={() => {
                              if (newSpellName) {
                                setState((prev) => ({
                                  ...prev,
                                  preparedSpells: [
                                    ...prev.preparedSpells,
                                    {
                                      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                      name: newSpellName,
                                      used: false,
                                    },
                                  ],
                                }));
                                setNewSpellName("");
                              }
                            }}
                          />
                        }
                      >
                        {t.addSpell}
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-3">
                {state.preparedSpells.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic text-center py-4">
                    {t.noSpells}
                  </p>
                ) : (
                  state.preparedSpells.map((spell) => (
                    <Card
                      key={spell.id}
                      className="bg-card/40 border-primary/10 group overflow-hidden"
                    >
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${spell.used ? "bg-muted" : "bg-primary/10"}`}
                          >
                            <Zap
                              className={`h-4 w-4 ${spell.used ? "text-muted-foreground" : "text-primary"}`}
                            />
                          </div>
                          <span
                            className={`font-medium text-sm truncate ${spell.used ? "text-muted-foreground line-through" : ""}`}
                          >
                            {spell.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => togglePreparedSpell(spell.id)}
                            className={`
                              h-8 w-8 rounded-md border-2 transition-all duration-200 flex items-center justify-center
                              ${
                                spell.used
                                  ? "bg-muted border-muted-foreground/30 text-muted-foreground"
                                  : "bg-primary/10 border-primary text-primary shadow-[0_0_8px_rgba(var(--primary),0.2)]"
                              }
                              hover:scale-110 active:scale-95
                            `}
                          >
                            {spell.used ? (
                              <Minus className="h-4 w-4" />
                            ) : (
                              <Zap className="h-4 w-4 fill-primary" />
                            )}
                          </button>

                          <AlertDialog>
                            <AlertDialogTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                />
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {t.confirmDeleteSpell}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t.confirmDeleteSpellDesc}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel
                                  variant="outline"
                                  size="default"
                                >
                                  {t.cancel}
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  variant="default"
                                  size="default"
                                  onClick={() =>
                                    setState((prev) => ({
                                      ...prev,
                                      preparedSpells:
                                        prev.preparedSpells.filter(
                                          (s) => s.id !== spell.id,
                                        ),
                                    }))
                                  }
                                >
                                  {t.reset}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="abilities" className="mt-4 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <Card className="bg-card/40 border-primary/10">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">
                      {t.hitDice}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingHitDice(!isEditingHitDice)}
                      className={`h-8 text-xs gap-1 ${isEditingHitDice ? "text-primary bg-primary/10" : ""}`}
                    >
                      <Settings2 className="h-3 w-3" />{" "}
                      {isEditingHitDice ? t.doneEditing : t.editHitDice}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {state.hitDice.map((hd) => (
                    <div key={hd.id} className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-blue-500" />
                          {isEditingHitDice ? (
                            <div className="flex items-center gap-2 bg-secondary/30 rounded-md px-1 py-0.5 border border-border/50">
                              <button
                                onClick={() =>
                                  setState((prev) => ({
                                    ...prev,
                                    hitDice: prev.hitDice.map((h) =>
                                      h.id === hd.id
                                        ? {
                                            ...h,
                                            total: Math.max(0, h.total - 1),
                                            used: Math.min(
                                              h.used,
                                              Math.max(0, h.total - 1),
                                            ),
                                          }
                                        : h,
                                    ),
                                  }))
                                }
                                className="p-1 hover:text-primary transition-colors"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="text-xs font-mono font-bold w-4 text-center">
                                {hd.total}
                              </span>
                              <button
                                onClick={() =>
                                  setState((prev) => ({
                                    ...prev,
                                    hitDice: prev.hitDice.map((h) =>
                                      h.id === hd.id
                                        ? { ...h, total: h.total + 1 }
                                        : h,
                                    ),
                                  }))
                                }
                                className="p-1 hover:text-primary transition-colors"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-sm font-medium">
                              {t.hitDice}
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-mono text-muted-foreground">
                          {isEditingHitDice
                            ? hd.dieType
                            : `${hd.total - hd.used} / ${hd.total} ${t.remaining}`}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Array.from({ length: hd.total }).map((_, i) => (
                          <button
                            key={i}
                            onClick={() =>
                              !isEditingHitDice &&
                              setState((prev) => ({
                                ...prev,
                                hitDice: prev.hitDice.map((h) =>
                                  h.id === hd.id
                                    ? { ...h, used: i < h.used ? i : i + 1 }
                                    : h,
                                ),
                              }))
                            }
                            disabled={isEditingHitDice}
                            className={`
                              h-10 w-10 rounded-full border-2 transition-all duration-200 flex items-center justify-center
                              ${
                                i < hd.used
                                  ? "bg-muted border-muted-foreground/30 text-muted-foreground"
                                  : "bg-blue-500/10 border-blue-500 text-blue-500"
                              }
                              ${isEditingHitDice ? "opacity-50 cursor-default" : "hover:scale-105 active:scale-95"}
                            `}
                          >
                            <Shield
                              className={`h-4 w-4 ${i < hd.used ? "" : "fill-blue-500"}`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  {t.features}
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingAbilities(!isEditingAbilities)}
                    className={`h-8 text-xs gap-1 ${isEditingAbilities ? "text-primary bg-primary/10" : ""}`}
                  >
                    <Settings2 className="h-3 w-3" />{" "}
                    {isEditingAbilities ? t.doneEditing : t.editAbilities}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs gap-1"
                        />
                      }
                    >
                      <RotateCcw className="h-3 w-3" /> {t.shortRest}
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {t.confirmShortRest}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {t.confirmShortRestDesc}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel variant="outline" size="default">
                          {t.cancel}
                        </AlertDialogCancel>
                        <AlertDialogAction
                          variant="default"
                          size="default"
                          onClick={resetShortRest}
                        >
                          {t.shortRest}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {state.abilities.length === 0 ? (
                <p className="text-sm text-muted-foreground italic text-center py-4">
                  {t.noAbilities}
                </p>
              ) : (
                state.abilities.map((ability) => (
                  <Card
                    key={ability.id}
                    className="bg-card/40 border-primary/10 overflow-hidden relative"
                  >
                    <div
                      className={`h-1 w-full ${ability.resetOn === "short" ? "bg-orange-500" : "bg-purple-500"}`}
                    />
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1 min-w-0 flex-1">
                          <p className="font-bold truncate">{ability.name}</p>
                          {ability.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {ability.description}
                              {ability.description.length > 40 && (
                                <button
                                  onClick={() => setSelectedAbility(ability)}
                                  className="ml-1 text-primary hover:underline font-medium"
                                >
                                  ...
                                </button>
                              )}
                            </p>
                          )}
                          <p className="text-[10px] uppercase tracking-tighter text-muted-foreground">
                            {t.resetOn}{" "}
                            {ability.resetOn === "short"
                              ? t.shortRest
                              : t.longRest}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          {isEditingAbilities ? (
                            <div className="flex items-center gap-2 bg-secondary/30 rounded-md px-1 py-0.5 border border-border/50">
                              <button
                                onClick={() =>
                                  setState((prev) => ({
                                    ...prev,
                                    abilities: prev.abilities.map((a) =>
                                      a.id === ability.id
                                        ? {
                                            ...a,
                                            total: Math.max(1, a.total - 1),
                                            used: Math.min(
                                              a.used,
                                              Math.max(1, a.total - 1),
                                            ),
                                          }
                                        : a,
                                    ),
                                  }))
                                }
                                className="p-1 hover:text-primary transition-colors"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="text-xs font-mono font-bold w-4 text-center">
                                {ability.total}
                              </span>
                              <button
                                onClick={() =>
                                  setState((prev) => ({
                                    ...prev,
                                    abilities: prev.abilities.map((a) =>
                                      a.id === ability.id
                                        ? { ...a, total: a.total + 1 }
                                        : a,
                                    ),
                                  }))
                                }
                                className="p-1 hover:text-primary transition-colors"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                              <Separator
                                orientation="vertical"
                                className="h-3 mx-1"
                              />
                              <button
                                onClick={() =>
                                  setState((prev) => ({
                                    ...prev,
                                    abilities: prev.abilities.filter(
                                      (a) => a.id !== ability.id,
                                    ),
                                  }))
                                }
                                className="p-1 hover:text-destructive transition-colors"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              {Array.from({ length: ability.total }).map(
                                (_, i) => (
                                  <button
                                    key={i}
                                    onClick={() => toggleAbility(ability.id, i)}
                                    className={`
                                    h-7 w-7 rounded-md border-2 transition-all duration-200 flex items-center justify-center
                                    ${
                                      i < ability.used
                                        ? "bg-muted border-muted-foreground/30 text-muted-foreground"
                                        : "bg-primary/10 border-primary text-primary shadow-[0_0_8px_rgba(var(--primary),0.2)]"
                                    }
                                    hover:scale-110 active:scale-95
                                  `}
                                  >
                                    {i < ability.used ? null : (
                                      <div className="h-2 w-2 rounded-full bg-primary" />
                                    )}
                                  </button>
                                ),
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}

              <Dialog
                open={isAddAbilityOpen}
                onOpenChange={setIsAddAbilityOpen}
              >
                <DialogTrigger
                  render={
                    <Button
                      variant="outline"
                      className="w-full border-dashed"
                    />
                  }
                >
                  <Plus className="h-4 w-4 mr-2" /> {t.addAbility}
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>{t.addAbility}</DialogTitle>
                    <DialogDescription>{t.abilityDesc}</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="ability-name">{t.name}</Label>
                      <Input
                        id="ability-name"
                        value={newAbilityName}
                        onChange={(e) => setNewAbilityName(e.target.value)}
                        placeholder="e.g. Rage, Ki Points"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="ability-description">
                        {t.description}
                      </Label>
                      <Input
                        id="ability-description"
                        value={newAbilityDescription}
                        onChange={(e) =>
                          setNewAbilityDescription(e.target.value)
                        }
                        placeholder={t.descriptionPlaceholder}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="ability-total">{t.uses}</Label>
                        <Input
                          id="ability-total"
                          type="number"
                          min="1"
                          value={newAbilityTotal}
                          onChange={(e) =>
                            setNewAbilityTotal(parseInt(e.target.value) || 1)
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>{t.resetType}</Label>
                        <div className="flex bg-secondary/30 p-1 rounded-md border border-border/50">
                          <button
                            onClick={() => setNewAbilityResetOn("short")}
                            className={`flex-1 text-[10px] py-1 rounded transition-all ${newAbilityResetOn === "short" ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-secondary"}`}
                          >
                            {t.shortRestAbbr}
                          </button>
                          <button
                            onClick={() => setNewAbilityResetOn("long")}
                            className={`flex-1 text-[10px] py-1 rounded transition-all ${newAbilityResetOn === "long" ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-secondary"}`}
                          >
                            {t.longRestAbbr}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose
                      render={
                        <Button
                          variant="default"
                          size="default"
                          onClick={() => {
                            if (newAbilityName) {
                              setState((prev) => ({
                                ...prev,
                                abilities: [
                                  ...prev.abilities,
                                  {
                                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                    name: newAbilityName,
                                    description: newAbilityDescription,
                                    total: newAbilityTotal,
                                    used: 0,
                                    resetOn: newAbilityResetOn,
                                  },
                                ],
                              }));
                              setNewAbilityName("");
                              setNewAbilityDescription("");
                              setNewAbilityTotal(1);
                              setNewAbilityResetOn("short");
                            }
                          }}
                        />
                      }
                    >
                      {t.addAbility}
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog
                open={!!selectedAbility}
                onOpenChange={(open) => !open && setSelectedAbility(null)}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{selectedAbility?.name}</DialogTitle>
                    <DialogDescription>{t.details}</DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {selectedAbility?.description}
                    </p>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => setSelectedAbility(null)}>
                      {t.cancel}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog
                open={!!selectedBuff}
                onOpenChange={(open) => !open && setSelectedBuff(null)}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{selectedBuff?.name}</DialogTitle>
                    <DialogDescription>{t.details}</DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {selectedBuff?.description}
                    </p>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => setSelectedBuff(null)}>
                      {t.cancel}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
