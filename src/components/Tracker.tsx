import * as React from 'react';
import { useState, useEffect } from 'react';
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
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
import { CharacterState, SpellSlot, Ability, HitDice, Buff } from '../types';
import { translations, Language } from '../translations';

const INITIAL_STATE: CharacterState = {
  name: 'Aventurero',
  hp: { current: 25, max: 25, temp: 0 },
  inspiration: false,
  spellSlots: [
    { level: 1, total: 4, used: 0 },
    { level: 2, total: 3, used: 0 },
    { level: 3, total: 2, used: 0 },
  ],
  hitDice: [
    { dieType: 'd8', total: 5, used: 0 }
  ],
  abilities: [],
  buffs: []
};

export function Tracker() {
  const [state, setState] = useState<CharacterState>(() => {
    const saved = localStorage.getItem('dnd_character_state');
    return saved ? JSON.parse(saved) : INITIAL_STATE;
  });

  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [newName, setNewName] = useState(state.name);
  const [isAddBuffOpen, setIsAddBuffOpen] = useState(false);
  const [newBuffName, setNewBuffName] = useState('');
  const [isAddAbilityOpen, setIsAddAbilityOpen] = useState(false);
  const [newAbilityName, setNewAbilityName] = useState('');
  const [isEditingSpellSlots, setIsEditingSpellSlots] = useState(false);
  const [newSpellLevel, setNewSpellLevel] = useState(state.spellSlots.length > 0 ? Math.max(...state.spellSlots.map(s => s.level)) + 1 : 1);
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('dnd_tracker_lang');
    return (saved as Language) || 'es';
  });

  const t = translations[lang];

  useEffect(() => {
    localStorage.setItem('dnd_tracker_lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('dnd_character_state', JSON.stringify(state));
  }, [state]);

  const updateHP = (amount: number) => {
    setState(prev => {
      let newCurrent = prev.hp.current + amount;
      if (newCurrent > prev.hp.max) newCurrent = prev.hp.max;
      if (newCurrent < 0) newCurrent = 0;
      return { ...prev, hp: { ...prev.hp, current: newCurrent } };
    });
  };

  const updateTempHP = (amount: number) => {
    setState(prev => ({
      ...prev,
      hp: { ...prev.hp, temp: Math.max(0, prev.hp.temp + amount) }
    }));
  };

  const toggleSpellSlot = (level: number, index: number) => {
    setState(prev => ({
      ...prev,
      spellSlots: prev.spellSlots.map(slot => 
        slot.level === level 
          ? { ...slot, used: index < slot.used ? index : index + 1 } 
          : slot
      )
    }));
  };

  const updateSpellSlotTotal = (level: number, delta: number) => {
    setState(prev => ({
      ...prev,
      spellSlots: prev.spellSlots.map(s => {
        if (s.level === level) {
          const newTotal = Math.max(0, s.total + delta);
          return { ...s, total: newTotal, used: Math.min(s.used, newTotal) };
        }
        return s;
      })
    }));
  };

  const addSpellLevel = () => {
    if (state.spellSlots.some(s => s.level === newSpellLevel)) return;
    setState(prev => ({
      ...prev,
      spellSlots: [...prev.spellSlots, { level: newSpellLevel, total: 1, used: 0 }].sort((a, b) => a.level - b.level)
    }));
    setNewSpellLevel(prev => prev + 1);
  };

  const removeSpellLevel = (level: number) => {
    setState(prev => ({
      ...prev,
      spellSlots: prev.spellSlots.filter(s => s.level !== level)
    }));
  };

  const toggleAbility = (id: string) => {
    setState(prev => ({
      ...prev,
      abilities: prev.abilities.map(a => 
        a.id === id ? { ...a, used: a.used >= a.total ? 0 : a.used + 1 } : a
      )
    }));
  };

  const resetShortRest = () => {
    setState(prev => ({
      ...prev,
      abilities: prev.abilities.map(a => a.resetOn === 'short' ? { ...a, used: 0 } : a)
    }));
  };

  const resetLongRest = () => {
    setState(prev => ({
      ...prev,
      hp: { ...prev.hp, current: prev.hp.max },
      spellSlots: prev.spellSlots.map(s => ({ ...s, used: 0 })),
      abilities: prev.abilities.map(a => ({ ...a, used: 0 })),
      hitDice: prev.hitDice.map(hd => ({ ...hd, used: Math.max(0, hd.used - Math.floor(hd.total / 2)) }))
    }));
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex flex-col min-w-0 max-w-[50%]">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-primary truncate">
              {state.name}
            </h1>
            <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
              <DialogTrigger render={<Button variant="ghost" size="icon-xs" className="text-muted-foreground hover:text-primary" />}>
                <Edit2 className="h-3 w-3" />
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{t.rename}</DialogTitle>
                  <DialogDescription>
                    {t.enterName}
                  </DialogDescription>
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
                  <DialogClose render={<Button onClick={() => {
                    if (newName) {
                      setState(prev => ({ ...prev, name: newName }));
                    }
                  }} />}>{t.saveChanges}</DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <AlertDialog>
              <AlertDialogTrigger render={<Button variant="ghost" size="icon-xs" className="text-muted-foreground hover:text-destructive" />}>
                <Trash2 className="h-3 w-3" />
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t.confirmReset}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t.confirmResetDesc}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel variant="outline" size="default">{t.cancel}</AlertDialogCancel>
                  <AlertDialogAction variant="default" size="default" onClick={() => setState(INITIAL_STATE)}>{t.reset}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-secondary/30 rounded-md p-0.5 border border-border/50 mr-2">
            <button 
              onClick={() => setLang('en')} 
              className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${lang === 'en' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-primary'}`}
            >
              EN
            </button>
            <button 
              onClick={() => setLang('es')} 
              className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${lang === 'es' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-primary'}`}
            >
              ES
            </button>
          </div>
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="outline" size="icon" title={t.longRest} />}>
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
                <AlertDialogCancel variant="outline" size="default">{t.cancel}</AlertDialogCancel>
                <AlertDialogAction variant="default" size="default" onClick={resetLongRest}>{t.longRest}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-full border border-border">
            <div className="flex items-center gap-1.5">
              <Star className={`h-4 w-4 ${state.inspiration ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
              <span className="text-[10px] uppercase font-bold tracking-tighter text-muted-foreground">{t.inspiration}</span>
            </div>
            <Switch 
              checked={state.inspiration} 
              onCheckedChange={(val) => setState(prev => ({ ...prev, inspiration: val }))} 
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
                      {t.hp}
                    </CardTitle>
                    <div className="text-right">
                      <span className="text-3xl font-bold font-mono">{state.hp.current}</span>
                      <span className="text-muted-foreground font-mono"> / {state.hp.max}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Progress value={(state.hp.current / state.hp.max) * 100} className="h-3 bg-secondary" />
                    {state.hp.temp > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-400 font-medium">{t.tempHp}</span>
                        <span className="font-mono font-bold">+{state.hp.temp}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between px-1">
                    <Label className="text-xs uppercase text-muted-foreground tracking-wider">{t.max} {t.hp}</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number" 
                        value={state.hp.max}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val)) setState(prev => ({ ...prev, hp: { ...prev.hp, max: val } }));
                        }}
                        className="h-8 w-24 text-center font-mono"
                      />
                    </div>
                  </div>

                  {state.hp.current === 0 && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-destructive tracking-widest">{t.deathSaves}</span>
                        <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => updateHP(1)}>{t.stabilized}</Button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase text-muted-foreground">{t.successes}</p>
                          <div className="flex gap-2">
                            {[1, 2, 3].map(i => (
                              <div key={`success-${i}`} className="h-4 w-4 rounded-full border border-green-500/50 bg-green-500/10" />
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase text-muted-foreground">{t.failures}</p>
                          <div className="flex gap-2">
                            {[1, 2, 3].map(i => (
                              <div key={`failure-${i}`} className="h-4 w-4 rounded-full border border-red-500/50 bg-red-500/10" />
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase text-muted-foreground tracking-wider">{t.current} {t.hp}</Label>
                      <div className="flex items-center gap-2">
                        <Button variant="destructive" size="icon" className="h-12 w-12 shrink-0" onClick={() => updateHP(-1)}>
                          <Minus className="h-6 w-6" />
                        </Button>
                        <Input 
                          type="number" 
                          className="h-12 text-center font-mono text-lg" 
                          placeholder="Amt"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const val = parseInt((e.target as HTMLInputElement).value);
                              if (!isNaN(val)) updateHP(val);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }}
                        />
                        <Button variant="default" size="icon" className="h-12 w-12 shrink-0 bg-green-600 hover:bg-green-700" onClick={() => updateHP(1)}>
                          <Plus className="h-6 w-6" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase text-muted-foreground tracking-wider">{t.tempHp}</Label>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-12 w-12 shrink-0" onClick={() => updateTempHP(-1)}>
                          <Minus className="h-6 w-6" />
                        </Button>
                        <Input 
                          type="number" 
                          className="h-12 text-center font-mono text-lg" 
                          placeholder="Amt"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const val = parseInt((e.target as HTMLInputElement).value);
                              if (!isNaN(val)) updateTempHP(val);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }}
                        />
                        <Button variant="outline" size="icon" className="h-12 w-12 shrink-0" onClick={() => updateTempHP(1)}>
                          <Plus className="h-6 w-6" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-4 border-border bg-card/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">{t.buffs}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {state.buffs.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic text-center py-4">{t.noBuffs}</p>
                  ) : (
                    state.buffs.map(buff => (
                      <div key={buff.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
                        <div>
                          <p className="font-medium text-sm">{buff.name}</p>
                          <p className="text-xs text-muted-foreground">{buff.description}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setState(prev => ({ ...prev, buffs: prev.buffs.filter(b => b.id !== buff.id) }))}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                  <Dialog open={isAddBuffOpen} onOpenChange={setIsAddBuffOpen}>
                    <DialogTrigger render={<Button variant="outline" className="w-full border-dashed" />}>
                      <Plus className="h-4 w-4 mr-2" /> {t.addBuff}
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>{t.addBuff}</DialogTitle>
                        <DialogDescription>
                          {t.buffDesc}
                        </DialogDescription>
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
                      </div>
                      <DialogFooter>
                        <DialogClose render={<Button onClick={() => {
                          if (newBuffName) {
                            setState(prev => ({
                              ...prev,
                              buffs: [...prev.buffs, { id: Date.now().toString(), name: newBuffName, description: 'Temporal effect' }]
                            }));
                            setNewBuffName('');
                          }
                        }} />}>{t.addBuff}</DialogClose>
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
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{t.spellcasting}</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsEditingSpellSlots(!isEditingSpellSlots)} 
                  className={`h-8 text-xs gap-1 ${isEditingSpellSlots ? 'text-primary bg-primary/10' : ''}`}
                >
                  <Settings2 className="h-3 w-3" /> {isEditingSpellSlots ? t.doneEditing : t.editSlots}
                </Button>
              </div>

              {state.spellSlots.map((slot) => (
                <Card key={slot.level} className="bg-card/40 border-primary/10 relative group">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">{t.level} {slot.level}</Badge>
                        <span className="text-sm font-medium">{t.spellSlots}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {isEditingSpellSlots ? (
                          <div className="flex items-center gap-2 bg-secondary/30 rounded-md px-1 py-0.5 border border-border/50">
                            <button onClick={() => updateSpellSlotTotal(slot.level, -1)} className="p-1 hover:text-primary transition-colors">
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-xs font-mono font-bold w-4 text-center">{slot.total}</span>
                            <button onClick={() => updateSpellSlotTotal(slot.level, 1)} className="p-1 hover:text-primary transition-colors">
                              <Plus className="h-3 w-3" />
                            </button>
                            <Separator orientation="vertical" className="h-3 mx-1" />
                            <button onClick={() => removeSpellLevel(slot.level)} className="p-1 hover:text-destructive transition-colors">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-mono text-muted-foreground">{slot.total - slot.used} / {slot.total} {t.available}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {slot.total === 0 && isEditingSpellSlots && (
                        <p className="text-[10px] text-muted-foreground italic">{t.noSlots}</p>
                      )}
                      {Array.from({ length: slot.total }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => !isEditingSpellSlots && toggleSpellSlot(slot.level, i)}
                          disabled={isEditingSpellSlots}
                          className={`
                            h-10 w-10 rounded-md border-2 transition-all duration-200 flex items-center justify-center
                            ${i < slot.used 
                              ? 'bg-muted border-muted-foreground/30 text-muted-foreground' 
                              : 'bg-primary/10 border-primary text-primary shadow-[0_0_10px_rgba(var(--primary),0.2)]'
                            }
                            ${isEditingSpellSlots ? 'opacity-50 cursor-default' : 'hover:scale-105 active:scale-95'}
                          `}
                        >
                          {i < slot.used ? <Minus className="h-4 w-4" /> : <Zap className="h-4 w-4 fill-primary" />}
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
                      <Label htmlFor="new-spell-level" className="text-xs text-muted-foreground">{t.newLevel}:</Label>
                      <Input 
                        id="new-spell-level"
                        type="number" 
                        value={newSpellLevel} 
                        onChange={(e) => setNewSpellLevel(parseInt(e.target.value) || 1)}
                        className="h-8 w-16 text-xs font-mono"
                        min="1"
                        max="9"
                      />
                    </div>
                    <Button size="sm" onClick={addSpellLevel} className="h-8 gap-1">
                      <Plus className="h-3 w-3" /> {t.addLevel}
                    </Button>
                  </CardContent>
                </Card>
              )}
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
                  <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">{t.hitDice}</CardTitle>
                </CardHeader>
                <CardContent>
                  {state.hitDice.map((hd, idx) => (
                    <div key={idx} className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-lg font-bold">{hd.dieType}</span>
                        <span className="text-sm font-mono text-muted-foreground">{hd.total - hd.used} / {hd.total} {t.remaining}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Array.from({ length: hd.total }).map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setState(prev => ({
                              ...prev,
                              hitDice: prev.hitDice.map((h, j) => 
                                j === idx ? { ...h, used: i < h.used ? i : i + 1 } : h
                              )
                            }))}
                            className={`
                              h-10 w-10 rounded-full border-2 transition-all duration-200 flex items-center justify-center
                              ${i < hd.used 
                                ? 'bg-muted border-muted-foreground/30 text-muted-foreground' 
                                : 'bg-blue-500/10 border-blue-500 text-blue-500'
                              }
                            `}
                          >
                            <Shield className={`h-4 w-4 ${i < hd.used ? '' : 'fill-blue-500'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{t.features}</h3>
                <Button variant="ghost" size="sm" onClick={resetShortRest} className="h-8 text-xs gap-1">
                  <RotateCcw className="h-3 w-3" /> {t.shortRest}
                </Button>
              </div>

              {state.abilities.length === 0 ? (
                <p className="text-sm text-muted-foreground italic text-center py-4">{t.noAbilities}</p>
              ) : (
                state.abilities.map((ability) => (
                  <Card key={ability.id} className="bg-card/40 border-primary/10 overflow-hidden">
                    <div className={`h-1 w-full ${ability.resetOn === 'short' ? 'bg-orange-500' : 'bg-purple-500'}`} />
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-bold">{ability.name}</p>
                          <p className="text-[10px] uppercase tracking-tighter text-muted-foreground">{t.resetOn} {ability.resetOn === 'short' ? t.shortRestAbbr : t.longRestAbbr} rest</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: ability.total }).map((_, i) => (
                            <button
                              key={i}
                              onClick={() => toggleAbility(ability.id)}
                              className={`
                                h-8 w-8 rounded border transition-all
                                ${i < ability.used 
                                  ? 'bg-muted border-muted-foreground/20' 
                                  : 'bg-primary/20 border-primary shadow-[0_0_8px_rgba(var(--primary),0.1)]'
                                }
                              `}
                            />
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
              
              <Dialog open={isAddAbilityOpen} onOpenChange={setIsAddAbilityOpen}>
                <DialogTrigger render={<Button variant="outline" className="w-full border-dashed" />}>
                  <Plus className="h-4 w-4 mr-2" /> {t.addAbility}
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>{t.addAbility}</DialogTitle>
                    <DialogDescription>
                      {t.abilityDesc}
                    </DialogDescription>
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
                  </div>
                  <DialogFooter>
                    <DialogClose render={<Button onClick={() => {
                      if (newAbilityName) {
                        setState(prev => ({
                          ...prev,
                          abilities: [...prev.abilities, { 
                            id: Date.now().toString(), 
                            name: newAbilityName, 
                            total: 1, 
                            used: 0, 
                            resetOn: 'short' 
                          }]
                        }));
                        setNewAbilityName('');
                      }
                    }} />}>{t.addAbility}</DialogClose>
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
