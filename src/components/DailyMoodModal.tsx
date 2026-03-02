import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { db } from '../db/db';
import type { DailyMood } from '../db/db';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input, Select } from './ui/Input';
import { Frown, Angry, Meh, Smile, SmilePlus, Zap, Activity, Moon, Coffee, Dumbbell, Utensils } from 'lucide-react';

interface DailyMoodModalProps {
    isOpen: boolean;
    onClose: () => void;
    journalId: number;
    existingMood?: DailyMood | null; // Optional if we are editing
}

export const DailyMoodModal: React.FC<DailyMoodModalProps> = ({ isOpen, onClose, journalId, existingMood }) => {
    // Face Mapping: 1 = Terrible, 5 = Excellent
    const defaultDate = format(new Date(), 'yyyy-MM-dd');

    const [moodScore, setMoodScore] = useState<number>(0); // 0 means not selected
    const [energyLevel, setEnergyLevel] = useState<number>(50);
    const [stressLevel, setStressLevel] = useState<number>(50);
    const [sleepHours, setSleepHours] = useState<number | ''>(8);
    const [dietScore, setDietScore] = useState<string>('Clean');
    const [caffeineIntake, setCaffeineIntake] = useState<string>('1-2 cups');
    const [exercised, setExercised] = useState<boolean>(true);
    const [screenTime, setScreenTime] = useState<number | ''>('');
    const [notes, setNotes] = useState<string>('');

    // Pre-fill if editing
    useEffect(() => {
        if (!isOpen) return;

        if (existingMood) {
            setMoodScore(existingMood.moodScore);
            setEnergyLevel(existingMood.energyLevel);
            setStressLevel(existingMood.stressLevel);
            setSleepHours(existingMood.sleepHours);
            setDietScore(existingMood.dietScore);
            setCaffeineIntake(existingMood.caffeineIntake || '1-2 cups');
            setExercised(existingMood.exercised ?? true);
            setScreenTime(existingMood.screenTime ?? '');
            setNotes(existingMood.notes || '');
        } else {
            // Reset to defaults
            setMoodScore(0);
            setEnergyLevel(50);
            setStressLevel(50);
            setSleepHours(8);
            setDietScore('Clean');
            setCaffeineIntake('1-2 cups');
            setExercised(true);
            setScreenTime('');
            setNotes('');
        }
    }, [isOpen, existingMood]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (moodScore === 0) {
            alert("Please select a mood!");
            return;
        }

        const moodData: DailyMood = {
            journalId,
            date: defaultDate, // Always today
            moodScore,
            energyLevel,
            stressLevel,
            sleepHours: Number(sleepHours) || 0,
            dietScore,
            caffeineIntake,
            exercised,
            screenTime: screenTime !== '' ? Number(screenTime) : undefined,
            notes
        };

        try {
            if (existingMood && existingMood.id) {
                await db.dailyMoods.put({ ...moodData, id: existingMood.id });
            } else {
                // Prevent duplicate entries for the same day
                const existing = await db.dailyMoods
                    .where({ journalId, date: defaultDate })
                    .first();

                if (existing) {
                    await db.dailyMoods.put({ ...moodData, id: existing.id });
                } else {
                    await db.dailyMoods.add(moodData);
                }
            }
            onClose();
        } catch (error) {
            console.error("Failed to save mood:", error);
            alert("Failed to save mood data.");
        }
    };

    const faces = [
        { score: 1, icon: <Angry size={40} />, color: '#EF4444', label: 'Terrible' }, // Red
        { score: 2, icon: <Frown size={40} />, color: '#F97316', label: 'Bad' },      // Orange
        { score: 3, icon: <Meh size={40} />, color: '#EAB308', label: 'Neutral' },  // Yellow
        { score: 4, icon: <Smile size={40} />, color: '#84CC16', label: 'Good' },     // Light Green
        { score: 5, icon: <SmilePlus size={40} />, color: '#22C55E', label: 'Excellent' } // Green
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="How's your mood?" width="600px">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

                {/* Mood Face Selector */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'var(--bg-tertiary)',
                    padding: '1.5rem',
                    borderRadius: '2rem',
                    gap: '0.5rem'
                }}>
                    {faces.map(face => {
                        const isSelected = moodScore === face.score;
                        return (
                            <button
                                key={face.score}
                                type="button"
                                onClick={() => setMoodScore(face.score)}
                                title={face.label}
                                style={{
                                    fontSize: isSelected ? '3.5rem' : '2.5rem',
                                    background: isSelected ? `${face.color}33` : 'transparent',
                                    border: isSelected ? `2px solid ${face.color}` : '2px solid transparent',
                                    borderRadius: '50%',
                                    width: isSelected ? '80px' : '60px',
                                    height: isSelected ? '80px' : '60px',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                    cursor: 'pointer',
                                    filter: isSelected ? 'none' : 'grayscale(0.8) opacity(0.5)',
                                    boxShadow: isSelected ? `0 0 20px ${face.color}40` : 'none',
                                    color: isSelected ? face.color : 'var(--text-secondary)'
                                }}
                            >
                                {face.icon}
                            </button>
                        );
                    })}
                </div>

                {/* Energy & Stress Section - Full Width Sliders */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem', borderBottom: '1px solid var(--border-color)' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Vitals</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div className="flex-between">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}><Zap size={16} className="text-muted" /> Energy Level</label>
                            <span style={{ fontSize: '0.875rem', color: 'var(--accent-primary)', fontWeight: 600 }}>{energyLevel} / 100</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="100"
                            value={energyLevel}
                            onChange={e => setEnergyLevel(Number(e.target.value))}
                            style={{ width: '100%', accentColor: '#EAB308' }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div className="flex-between">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}><Activity size={16} className="text-muted" /> Stress Level</label>
                            <span style={{ fontSize: '0.875rem', color: 'var(--loss-color)', fontWeight: 600 }}>{stressLevel} / 100</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="100"
                            value={stressLevel}
                            onChange={e => setStressLevel(Number(e.target.value))}
                            style={{ width: '100%', accentColor: '#EF4444' }}
                        />
                    </div>
                </div>

                {/* Habits & Lifestyle Section - Grid Layout */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem', borderBottom: '1px solid var(--border-color)' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Lifestyle Factors</h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

                        {/* Column 1 */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <Input
                                type="number"
                                step="0.5"
                                label={<span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Moon size={16} className="text-muted" /> Sleep (Hours)</span>}
                                placeholder="e.g. 7.5"
                                value={sleepHours}
                                onChange={e => setSleepHours(e.target.value !== '' ? Number(e.target.value) : '')}
                            />

                            <Select
                                label={<span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Utensils size={16} className="text-muted" /> Diet / Junk Food</span>}
                                value={dietScore}
                                onChange={e => setDietScore(e.target.value)}
                                options={[
                                    { label: 'Clean Eating', value: 'Clean' },
                                    { label: 'A Little Junk', value: 'A Little Junk' },
                                    { label: 'Moderate Junk', value: 'Moderate Junk' },
                                    { label: 'Heavy Junk', value: 'Heavy Junk' }
                                ]}
                            />
                        </div>

                        {/* Column 2 */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <Select
                                label={<span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Coffee size={16} className="text-muted" /> Caffeine Intake</span>}
                                value={caffeineIntake}
                                onChange={e => setCaffeineIntake(e.target.value)}
                                options={[
                                    { label: 'None', value: 'None' },
                                    { label: '1-2 cups', value: '1-2 cups' },
                                    { label: '3-4 cups', value: '3-4 cups' },
                                    { label: '5+ cups', value: '5+ cups' }
                                ]}
                            />

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}><Dumbbell size={16} className="text-muted" /> Exercised Today?</label>
                                <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
                                    <Button
                                        type="button"
                                        variant={exercised ? 'primary' : 'secondary'}
                                        onClick={() => setExercised(true)}
                                        style={{ flex: 1, background: exercised ? 'var(--win-color)' : '', color: exercised ? '#fff' : '', padding: '0.6rem 0' }}
                                    >
                                        Yes
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={!exercised ? 'danger' : 'secondary'}
                                        onClick={() => setExercised(false)}
                                        style={{ flex: 1, padding: '0.6rem 0' }}
                                    >
                                        No
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Additional Note */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Note</label>
                    <textarea
                        className="input-base"
                        rows={3}
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Today was a great day! Everything went smoothly..."
                        style={{ padding: '0.8rem', borderRadius: 'var(--radius-sm)' }}
                    />
                </div>

                {/* Footer Action */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1.5rem' }}>
                    <Button type="submit" disabled={moodScore === 0} style={{ padding: '0.8rem 2rem', fontSize: '1rem' }}>
                        Save Daily Log
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
