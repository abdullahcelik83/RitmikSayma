import React, { useMemo, useState } from 'react';
import { Animated, Easing, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

const COUNTING_MODES = [
  {
    id: 'two',
    label: 'İkişer',
    step: 2,
    color: '#FF6F91',
    accent: '#FFE0E9',
    emoji: '🦄'
  },
  {
    id: 'three',
    label: 'Üçer',
    step: 3,
    color: '#FF9671',
    accent: '#FFE8D6',
    emoji: '🚀'
  },
  {
    id: 'four',
    label: 'Dörder',
    step: 4,
    color: '#FFC75F',
    accent: '#FFF4D9',
    emoji: '🐯'
  }
];

const TARGET_LENGTH = 10;

function useBounceAnimation() {
  const animatedValue = useMemo(() => new Animated.Value(1), []);

  const trigger = () => {
    Animated.sequence([
      Animated.spring(animatedValue, {
        toValue: 1.08,
        friction: 2,
        useNativeDriver: true
      }),
      Animated.spring(animatedValue, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true
      })
    ]).start();
  };

  return { scale: animatedValue, trigger };
}

function useShakeAnimation() {
  const translate = useMemo(() => new Animated.Value(0), []);

  const trigger = () => {
    Animated.sequence([
      Animated.timing(translate, { toValue: 12, duration: 50, useNativeDriver: true }),
      Animated.timing(translate, { toValue: -12, duration: 50, useNativeDriver: true }),
      Animated.timing(translate, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(translate, { toValue: 0, duration: 50, useNativeDriver: true })
    ]).start();
  };

  return { translate, trigger };
}

const ModeButton = ({ mode, onPress }) => {
  const { scale, trigger } = useBounceAnimation();

  const handlePress = () => {
    trigger();
    onPress(mode);
  };

  return (
    <Animated.View style={[styles.modeButton, { backgroundColor: mode.accent, transform: [{ scale }] }]}> 
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <Text style={[styles.modeEmoji, { color: mode.color }]}>{mode.emoji}</Text>
        <Text style={[styles.modeLabel, { color: mode.color }]}>{mode.label}</Text>
        <Text style={[styles.modeStep, { color: mode.color }]}>+{mode.step}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const ProgressBar = ({ progress, color }) => (
  <View style={styles.progressContainer}>
    <Animated.View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
  </View>
);

const CelebrationBanner = ({ color }) => {
  const pulse = useMemo(() => new Animated.Value(0), []);

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();
  }, [pulse]);

  return (
    <Animated.View
      style={{
        padding: 16,
        borderRadius: 16,
        backgroundColor: color,
        transform: [
          {
            scale: pulse.interpolate({
              inputRange: [0, 1],
              outputRange: [0.95, 1.05]
            })
          }
        ]
      }}
    >
      <Text style={styles.celebrationText}>Harika! Seriyi tamamladın 🎉</Text>
    </Animated.View>
  );
};

const GameScreen = ({ mode, onRestart }) => {
  const [answers, setAnswers] = useState([]);
  const [feedback, setFeedback] = useState('Haydi başlayalım! Doğru sırayı bul.');
  const { translate, trigger } = useShakeAnimation();

  const sequence = useMemo(() => {
    const start = mode.step;
    return Array.from({ length: TARGET_LENGTH }, (_, index) => start + index * mode.step);
  }, [mode.step]);

  const shuffledNumbers = useMemo(() => {
    const numbers = [...sequence];
    for (let i = numbers.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    return numbers;
  }, [sequence, answers.length]);

  const expectedNumber = sequence[answers.length];
  const progress = answers.length / sequence.length;
  const completed = answers.length === sequence.length;

  const handlePress = (value) => {
    if (completed) return;
    if (value === expectedNumber) {
      setAnswers((prev) => [...prev, value]);
      setFeedback('Süper! Devam et 🎊');
    } else {
      setFeedback('Ops! Tekrar dene 🤔');
      trigger();
    }
  };

  return (
    <View style={styles.gameContainer}>
      <Text style={[styles.heading, { color: mode.color }]}>{mode.label} Sayma Oyunu</Text>
      <ProgressBar progress={progress} color={mode.color} />
      <Text style={styles.feedback}>{feedback}</Text>

      {completed ? (
        <CelebrationBanner color={mode.color} />
      ) : (
        <Animated.View style={{ transform: [{ translateX: translate }] }}>
          <FlatList
            data={shuffledNumbers}
            keyExtractor={(item) => item.toString()}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            contentContainerStyle={{ gap: 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.numberTile, { borderColor: mode.color, backgroundColor: answers.includes(item) ? mode.accent : 'white' }]}
                onPress={() => handlePress(item)}
                activeOpacity={0.85}
              >
                <Text style={[styles.numberText, { color: mode.color }]}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </Animated.View>
      )}

      <TouchableOpacity style={[styles.secondaryButton, { borderColor: mode.color }]} onPress={onRestart}>
        <Text style={[styles.secondaryButtonText, { color: mode.color }]}>{completed ? 'Yeniden Oyna' : 'Mod Seçimine Dön'}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function App() {
  const [selectedMode, setSelectedMode] = useState(null);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      {selectedMode ? (
        <GameScreen mode={selectedMode} onRestart={() => setSelectedMode(null)} />
      ) : (
        <View style={styles.homeContainer}>
          <Text style={styles.heading}>Ritmik Sayma</Text>
          <Text style={styles.subHeading}>Favori sayma stilini seç ve maceraya başla!</Text>
          <View style={styles.modeList}>
            {COUNTING_MODES.map((mode) => (
              <ModeButton key={mode.id} mode={mode} onPress={setSelectedMode} />
            ))}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7FF'
  },
  homeContainer: {
    flex: 1,
    padding: 24,
    gap: 24
  },
  heading: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2B2D42'
  },
  subHeading: {
    fontSize: 18,
    color: '#8D99AE'
  },
  modeList: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  modeButton: {
    flex: 1,
    marginHorizontal: 6,
    padding: 16,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5
  },
  modeEmoji: {
    fontSize: 48,
    marginBottom: 8
  },
  modeLabel: {
    fontSize: 20,
    fontWeight: '700'
  },
  modeStep: {
    fontSize: 16,
    fontWeight: '600'
  },
  gameContainer: {
    flex: 1,
    padding: 24,
    gap: 16
  },
  progressContainer: {
    width: '100%',
    height: 16,
    backgroundColor: '#E5E5E5',
    borderRadius: 12,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%'
  },
  feedback: {
    fontSize: 18,
    color: '#2B2D42'
  },
  numberTile: {
    flex: 1,
    paddingVertical: 20,
    marginHorizontal: 8,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center'
  },
  numberText: {
    fontSize: 28,
    fontWeight: '800'
  },
  celebrationText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center'
  },
  secondaryButton: {
    marginTop: 'auto',
    paddingVertical: 18,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center'
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '700'
  }
});
