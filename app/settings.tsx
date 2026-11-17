import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LumiFace } from '@/components/Lumi';
import { PrimaryButton, SectionTitle, Segmented, monoText } from '@/components/ui';
import { useStore } from '@/store';
import { radius, useTheme } from '@/theme';
import { FREE_COMMENTS, Pronoun, Reminder, ThemeMode } from '@/types';

const onOff = [
  { value: 'on' as const, label: 'Ligada' },
  { value: 'off' as const, label: 'Desligada' },
];

export default function Settings() {
  const c = useTheme();
  const { profile, updateProfile, reset } = useStore();

  async function setReminder(v: Reminder) {
    updateProfile({ reminder: v });
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (v === 'off') return;
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Memora', body: `Como foi seu dia, ${profile.name}? A Lumi quer saber ✦` },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: Number(v), minute: 0 },
    });
  }

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: 20, paddingBottom: 80 }}>
      <View style={[styles.grabber, { backgroundColor: c.muted }]} />

      <SectionTitle title="Assinatura" />
      <View style={[styles.card, { backgroundColor: c.surface }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <LumiFace size={56} />
          <View>
            <Text style={{ color: c.text, fontSize: 20, fontWeight: '500' }}>{profile.plus ? 'Memora+' : 'Plano gratuito'}</Text>
            <Text style={monoText(c.muted)}>
              {profile.plus ? 'Lumi comenta todos os moments' : `${Math.min(profile.commentsUsed, FREE_COMMENTS)} de ${FREE_COMMENTS} moments com a Lumi`}
            </Text>
          </View>
        </View>
        {!profile.plus && <PrimaryButton title="Assinar o Memora+" onPress={() => router.push('/paywall')} />}
      </View>

      <SectionTitle title="Backup e sincronização" />
      <View style={[styles.card, { backgroundColor: c.surface, flexDirection: 'row', gap: 12, alignItems: 'center' }]}>
        <Text style={{ fontSize: 22, color: c.text }}>☁︎</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.text, fontSize: 17 }}>Salvo neste aparelho</Text>
          <Text style={monoText(c.muted)}>Sincronização na nuvem chega em breve</Text>
        </View>
      </View>

      <SectionTitle title="Seu nome" subtitle="Como a Lumi te chama" />
      <TextInput
        value={profile.name}
        onChangeText={(name) => updateProfile({ name })}
        style={[styles.input, { backgroundColor: c.surface, color: c.text }]}
      />

      <Block title="Como a Lumi fala com você" subtitle="Concordância das falas e dos stories">
        <Segmented<Pronoun>
          value={profile.pronoun}
          onChange={(pronoun) => updateProfile({ pronoun })}
          options={[
            { value: 'ele', label: 'Ele' },
            { value: 'ela', label: 'Ela' },
            { value: 'neutro', label: 'Neutro' },
          ]}
        />
      </Block>

      <Block title="Tema" subtitle="Aparência do app">
        <Segmented<ThemeMode>
          value={profile.theme}
          onChange={(theme) => updateProfile({ theme })}
          options={[
            { value: 'light', label: 'Claro' },
            { value: 'dark', label: 'Escuro' },
            { value: 'system', label: 'Sistema' },
          ]}
        />
      </Block>

      <Block title="Voz da Lumi" subtitle="Som das letras quando ela fala">
        <Segmented value={profile.voice ? 'on' : 'off'} onChange={(v) => updateProfile({ voice: v === 'on' })} options={onOff} />
      </Block>

      <Block title="Vibração da Lumi" subtitle="Toque leve a cada palavra">
        <Segmented value={profile.haptics ? 'on' : 'off'} onChange={(v) => updateProfile({ haptics: v === 'on' })} options={onOff} />
      </Block>

      <Block title="Mostrar a Lumi" subtitle="A Lumi nas telas e nos stories">
        <Segmented value={profile.showBuddy ? 'on' : 'off'} onChange={(v) => updateProfile({ showBuddy: v === 'on' })} options={onOff} />
      </Block>

      <Block title="Lembrete da noite" subtitle="Só nos dias sem moment">
        <Segmented<Reminder>
          value={profile.reminder}
          onChange={setReminder}
          options={[
            { value: 'off', label: 'Desligado' },
            { value: '21', label: '21h' },
            { value: '22', label: '22h' },
          ]}
        />
      </Block>

      <SectionTitle title="Sobre" />
      <Text style={{ color: c.muted, fontSize: 15, lineHeight: 22 }}>
        A Lumi é uma IA. Ela recebe só o texto necessário para responder — fotos e localização ficam no seu aparelho.
      </Text>

      <Pressable
        style={{ marginTop: 32 }}
        onPress={() =>
          Alert.alert('Apagar tudo?', 'Todos os moments, stories e pessoas serão apagados deste aparelho.', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Apagar', style: 'destructive', onPress: () => { reset(); router.replace('/onboarding'); } },
          ])
        }
      >
        <Text style={{ color: '#E5684F', fontSize: 16 }}>Apagar todos os dados</Text>
      </Pressable>
    </ScrollView>
  );
}

function Block({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 28 }}>
      <SectionTitle title={title} subtitle={subtitle} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  grabber: { width: 44, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 20, opacity: 0.5 },
  card: { borderRadius: radius.lg, padding: 18, marginBottom: 28 },
  input: { height: 58, borderRadius: radius.md, paddingHorizontal: 20, fontSize: 18 },
});
