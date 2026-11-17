import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LumiFace } from '@/components/Lumi';
import { SpeechBubble } from '@/components/SpeechBubble';
import { IconButton, PrimaryButton, monoText } from '@/components/ui';
import { useStore } from '@/store';
import { body, display, F, heading, mono, radius, useTheme } from '@/theme';

type Plan = 'annual' | 'monthly';

/**
 * Paywall do Memora+.
 * TODO: integrar compras reais (RevenueCat ou expo-iap) antes de publicar.
 * Hoje o botão só mostra um aviso — nenhuma cobrança acontece.
 */
export default function Paywall() {
  const c = useTheme();
  const { profile } = useStore();
  const [plan, setPlan] = useState<Plan>('annual');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={styles.top}>
        <Text style={[monoText(c.text, 14), { letterSpacing: 1 }]}>MEMORA+</Text>
        <IconButton icon="close" label="Fechar" onPress={() => router.back()} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <LumiFace size={80} mood="excited" />
          <View style={{ flex: 1 }}>
            <SpeechBubble text={`Dá uma olhada${profile.name ? ', ' + profile.name : ''}! Prometo valer a pena.`} />
          </View>
        </View>

        <Text style={[display(32, c.text), { marginTop: 24 }]}>Sua vida não cabe em poucos capítulos.</Text>
        <Text style={[body(16, c.muted), { marginTop: 10 }]}>
          Com o Memora+, cada fase vira uma história, e a Lumi fica do seu lado em todas elas.
        </Text>

        <Feature icon="▤" title="Stories sem limite" text="Cada fase vira um capítulo, e a Lumi continua escrevendo." />
        <Feature icon="❝" title="A Lumi comenta todos os seus moments" text="No grátis, ela comenta os 10 primeiros. Com o Memora+, acompanha cada um." />
        <Feature icon="✦" title="Retrospectiva do ano" text="Seu ano inteiro contado pela Lumi em dezembro." />

        <View style={{ marginTop: 28 }}>
          <View style={styles.badgeWrap}>
            <View style={[styles.badge, { backgroundColor: c.accent }]}>
              <Text style={{ fontFamily: mono, fontSize: 12, color: c.accentText }}>MELHOR ESCOLHA · 7 DIAS GRÁTIS</Text>
            </View>
          </View>
          <PlanCard active={plan === 'annual'} onPress={() => setPlan('annual')} title="Anual" sub="Equivale a R$ 7,49/mês" price="R$ 89,90" />
          <PlanCard active={plan === 'monthly'} onPress={() => setPlan('monthly')} title="Mensal" sub="Cobrado todo mês" price="R$ 14,90" />
        </View>
      </ScrollView>

      <View style={{ padding: 20 }}>
        <PrimaryButton
          title={plan === 'annual' ? 'Começar 7 dias grátis' : 'Assinar mensal'}
          onPress={() => Alert.alert('Em breve', 'As compras ainda não estão integradas nesta versão.')}
        />
        <Text style={[monoText(c.muted, 12), { textAlign: 'center', marginTop: 10 }]}>
          {plan === 'annual' ? 'Grátis por 7 dias. Depois, R$ 89,90/ano. Cancele antes e não paga nada.' : 'R$ 14,90/mês. Cancele quando quiser.'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

function Feature({ icon, title, text }: { icon: string; title: string; text: string }) {
  const c = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 14, marginTop: 22 }}>
      <View style={[styles.icon, { backgroundColor: c.accent }]}>
        <Text style={{ color: c.accentText, fontSize: 18 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={heading(16, c.text)}>{title}</Text>
        <Text style={[monoText(c.muted, 11.5), { marginTop: 4, lineHeight: 17 }]}>{text}</Text>
      </View>
    </View>
  );
}

function PlanCard({ active, onPress, title, sub, price }: { active: boolean; onPress: () => void; title: string; sub: string; price: string }) {
  const c = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.plan, { backgroundColor: c.surface, borderColor: active ? c.text : c.border }]}>
      <View style={[styles.radio, { borderColor: c.text }]}>{active && <View style={[styles.radioDot, { backgroundColor: c.text }]} />}</View>
      <View style={{ flex: 1 }}>
        <Text style={heading(18, c.text)}>{title}</Text>
        <Text style={monoText(c.muted, 11)}>{sub}</Text>
      </View>
      <Text style={{ color: c.text, fontSize: 18, fontFamily: F.bold }}>{price}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 8 },
  icon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  badgeWrap: { alignItems: 'center', zIndex: 2, marginBottom: -12 },
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.pill },
  plan: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1.5, borderRadius: radius.lg, padding: 18, marginBottom: 10 },
  radio: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 14, height: 14, borderRadius: 7 },
});
