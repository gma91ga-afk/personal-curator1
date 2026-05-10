// Reusable UI components for the onboarding flow

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ViewStyle,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../utils/theme';

// --- Multi-select chip grid (for topics, content types, sources) ---
interface ChipGridProps {
  options: string[];
  selected: string[];
  onToggle: (option: string) => void;
  multi?: boolean;
  style?: ViewStyle;
}

export function ChipGrid({ options, selected, onToggle, multi = true, style }: ChipGridProps) {
  return (
    <View style={[styles.chipGrid, style]}>
      {options.map((option) => {
        const isSelected = selected.includes(option);
        return (
          <TouchableOpacity
            key={option}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => onToggle(option)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// --- Single-select button list (for tones, depths) ---
interface OptionListProps {
  options: string[];
  selected: string | null;
  onSelect: (option: string) => void;
  style?: ViewStyle;
}

export function OptionList({ options, selected, onSelect, style }: OptionListProps) {
  return (
    <View style={[styles.optionList, style]}>
      {options.map((option) => {
        const isSelected = option === selected;
        return (
          <TouchableOpacity
            key={option}
            style={[styles.optionRow, isSelected && styles.optionRowSelected]}
            onPress={() => onSelect(option)}
            activeOpacity={0.7}
          >
            <View style={[styles.radio, isSelected && styles.radioSelected]}>
              {isSelected && <View style={styles.radioInner} />}
            </View>
            <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// --- Time picker row (for notification times) ---
interface TimePickerProps {
  times: string[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  maxTimes?: number;
  style?: ViewStyle;
}

export function TimePickerList({ times, onAdd, onRemove, maxTimes = 3, style }: TimePickerProps) {
  return (
    <View style={[styles.timeList, style]}>
      {times.map((time, index) => (
        <View key={index} style={styles.timeRow}>
          <View style={styles.timeDisplay}>
            <Text style={styles.timeText}>{time}</Text>
          </View>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => onRemove(index)}
            activeOpacity={0.7}
          >
            <Text style={styles.removeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}
      {times.length < maxTimes && (
        <TouchableOpacity
          style={styles.addTimeButton}
          onPress={onAdd}
          activeOpacity={0.7}
        >
          <Text style={styles.addTimeText}>+ Add notification time</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// --- Progress bar ---
interface ProgressBarProps {
  current: number;
  total: number;
  style?: ViewStyle;
}

export function ProgressBar({ current, total, style }: ProgressBarProps) {
  const progress = total > 0 ? (current + 1) / total : 0;
  return (
    <View style={[styles.progressContainer, style]}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.progressText}>
        Step {current + 1} of {total}
      </Text>
    </View>
  );
}

// --- Continue button ---
interface ContinueButtonProps {
  onPress: () => void;
  disabled?: boolean;
  title?: string;
  style?: ViewStyle;
}

export function ContinueButton({ onPress, disabled = false, title = 'Continue', style }: ContinueButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.continueButton, disabled && styles.continueButtonDisabled, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={[styles.continueText, disabled && styles.continueTextDisabled]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  chipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '20',
  },
  chipText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    ...FONTS.medium,
  },
  chipTextSelected: {
    color: COLORS.primaryLight,
  },

  optionList: {
    gap: SPACING.sm,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  optionRowSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '15',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  radioSelected: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  optionText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    ...FONTS.regular,
    flex: 1,
  },
  optionTextSelected: {
    color: COLORS.text,
    ...FONTS.medium,
  },

  timeList: {
    gap: SPACING.sm,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timeDisplay: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: RADIUS.sm,
  },
  timeText: {
    fontSize: 18,
    color: COLORS.text,
    ...FONTS.semibold,
    letterSpacing: 1,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.error + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: COLORS.error,
    fontSize: 14,
    ...FONTS.bold,
  },
  addTimeButton: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addTimeText: {
    color: COLORS.primaryLight,
    fontSize: 14,
    ...FONTS.medium,
  },

  progressContainer: {
    alignItems: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 2,
    marginBottom: SPACING.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textMuted,
    ...FONTS.medium,
  },

  continueButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  continueButtonDisabled: {
    backgroundColor: COLORS.surfaceLight,
    opacity: 0.6,
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 16,
    ...FONTS.semibold,
  },
  continueTextDisabled: {
    color: COLORS.textMuted,
  },
});
