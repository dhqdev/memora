import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LumiFace } from '@/components/Lumi';
import { Icon } from '@/components/Icon';
import { Avatar, OutlineButton, PressableScale, PrimaryButton, SectionTitle, Segmented, monoText } from '@/components/ui';
import { photoUri } from '@/photos';
import { useStore } from '@/store';
import { body, F, heading, radius, useTheme } from '@/theme';
import { FREE_COMMENTS, Pronoun, Reminder, ThemeMode } from '@/types';

const onOff = [
  { value: 'on' as const, label: 'Ligada' },
  { value: 'off' as const, label: 'Desligada' },
];

export default function Settings() {
  const c = useTheme();
  const { profile, updateProfile, reset } = useStore();
  const [notif, setNotif] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');

  useEffect(() => {
    Notifications.getPermissionsAsync().then((p) => setNotif(p.status)).catch(() => {});
  }, []);

  async function enableNotifications() {
    const p = await Notifications.requestPermissionsAsync();
    setNotif(p.status);
    if (p.status !== 'granted') Alert.alert('Notificações desligadas', 'Você pode ativar nos Ajustes do iPhone, em Memora > Notificações.');
  }

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

      <PressableScale scaleTo={0.98} onPress={() => router.push('/profile')} style={[styles.card, styles.profileCard, { backgroundColor: c.surface }]}>
        <Avatar name={profile.name || 'M'} size={52}>
          {profile.photo ? <Image source={{ uri: photoUri(profile.photo) }} style={StyleSheet.absoluteFill} /> : undefined}
        </Avatar>
        <View style={{ flex: 1 }}>
          <Text style={heading(18, c.text)}>{profile.name || 'Seu perfil'}</Text>
          <Text style={monoText(c.muted, 11)}>{profile.handle ? '@' + profile.handle : 'Ver e editar perfil'}</Text>
        </View>
        <Icon name="chevRight" size={18} color={c.muted} />
      </PressableScale>

      <SectionTitle title="Assinatura" />
      <View style={[styles.card, { backgroundColor: c.surface }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <LumiFace size={56} />
          <View>
            <Text style={heading(18, c.text)}>{profile.plus ? 'Memora+' : 'Plano gratuito'}</Text>
            <Text style={monoText(c.muted, 11)}>
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
          <Text style={heading(15, c.text)}>Salvo neste aparelho</Text>
          <Text style={monoText(c.muted, 11)}>Sincronização na nuvem chega em breve</Text>
        </View>
      </View>

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

      <Block title="Notificações" subtitle="Chegam em silêncio na Central de Notificações">
        {notif === 'granted' ? (
          <View style={[styles.okRow, { borderColor: c.border }]}>
            <Text style={heading(15, c.text)}>Ativadas</Text>
          </View>
        ) : (
          <OutlineButton title="Ativar notificações" onPress={enableNotifications} />
        )}
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

      <View style={{ marginTop: 32 }}>
        <SectionTitle title="Sobre" />
        <Row
          label="Sobre a Lumi"
          onPress={() =>
            Alert.alert('Sobre a Lumi', 'A Lumi é uma IA. Ela recebe só o texto necessário para responder; fotos e localização ficam no seu aparelho.')
          }
        />
        <Row label="Política de privacidade" onPress={() => Alert.alert('Em breve', 'O link da política entra antes de publicar nas lojas.')} />
        <Row label="Termos de uso" onPress={() => Alert.alert('Em breve', 'O link dos termos entra antes de publicar nas lojas.')} />
      </View>

      <Pressable
        style={{ marginTop: 32 }}
        onPress={() =>
          Alert.alert('Apagar tudo?', 'Todos os moments, stories e pessoas serão apagados deste aparelho.', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Apagar', style: 'destructive', onPress: () => { reset(); router.replace('/onboarding'); } },
          ])
        }
      >
        <Text style={{ color: '#D9533A', fontSize: 15, fontFamily: F.medium }}>Apagar todos os dados</Text>
      </Pressable>
    </ScrollView>
  );
}

function Row({ label, onPress }: { label: string; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, { borderBottomColor: c.border, opacity: pressed ? 0.6 : 1 }]}>
      <Text style={body(16, c.text)}>{label}</Text>
      <Icon name="chevRight" size={18} color={c.muted} />
    </Pressable>
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
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  okRow: { height: 48, borderRadius: radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
});
