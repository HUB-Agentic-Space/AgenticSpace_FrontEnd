'use client';

/**
 * @file page.js (rota '/certificado/regras')
 * @description Página pública com as regras para obtenção de certificados
 * do Agentic Space. Acessível sem autenticação.
 */

import Link from 'next/link';
import {
  Award,
  ShieldAlert,
  FileCheck2,
  Eye,
  Mail,
  Users,
  Search,
  Ban,
  BookOpen,
} from 'lucide-react';

const RULES = [
  {
    icon: BookOpen,
    title: 'Execução autônoma',
    text: 'O solicitante assume a responsabilidade de executar cada tarefa sozinho, usando apenas recursos tecnológicos de autoaprendizado como Tutoriais, Manuais, Livros, Sistemas de Busca e IA Generativa para consulta.',
  },
  {
    icon: Ban,
    title: 'Autoria exclusiva do solicitante',
    text: 'O solicitante deve ser o autor das atividades, não podendo terceirizá-las. Se for identificado que as tarefas foram feitas por terceiros, automaticamente estará desclassificado, podendo inclusive ser banido da plataforma.',
  },
  {
    icon: FileCheck2,
    title: 'Apresentação de provas',
    text: 'O solicitante concorda que deve apresentar as provas solicitadas para obter o certificado, e poderá em casos excepcionais vir a ser solicitado de provas extras.',
  },
  {
    icon: Eye,
    title: 'Publicação pública das provas',
    text: 'Todas as provas serão postadas de forma pública, sendo de responsabilidade do solicitante os cuidados para evitar divulgação de senhas, chaves privadas e outros dados sensíveis.',
  },
  {
    icon: Mail,
    title: 'Envio de informações sensíveis',
    text: 'Quando necessário, será solicitado ao solicitante informações extras, como dados sensíveis, que deverão ser enviadas para o e-mail certificados@rapport.tec.br.',
  },
  {
    icon: Users,
    title: 'Desafios em equipe',
    text: 'Quando houver desafios em equipe, todos deverão apresentar isoladamente as provas de conclusão dos trabalhos para obter o certificado.',
  },
  {
    icon: ShieldAlert,
    title: 'Auditoria e verificação',
    text: 'Todos os dados serão auditados e verificados. Se verificada tentativa de fraude, o solicitante será desqualificado e poderá ser banido da plataforma.',
  },
];

export default function CertificateRulesPage() {
  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl border border-brand-500/20 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/70 p-6 shadow-2xl sm:p-9">
        <div className="flex items-center gap-4">
          <Award className="text-brand-400 shrink-0" size={48} />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Regras para Obtenção de Certificados
            </h1>
            <p className="mt-2 text-slate-300">
              Leia atentamente as regras abaixo antes de solicitar seu certificado.
              Ao iniciar a solicitação, você concorda integralmente com estes termos.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {RULES.map((rule, index) => {
          const Icon = rule.icon;
          return (
            <div
              key={index}
              className="card flex items-start gap-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 border border-brand-500/20">
                <Icon className="text-brand-400" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {index + 1}. {rule.title}
                </h2>
                <p className="mt-1 text-sm text-slate-300 leading-relaxed">
                  {rule.text}
                </p>
              </div>
            </div>
          );
        })}
      </section>

      <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-amber-200">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 shrink-0" size={24} />
          <div>
            <h3 className="font-semibold">Importante</h3>
            <p className="mt-1 text-sm text-amber-100/90">
              O descumprimento de qualquer uma destas regras pode resultar na
              desclassificação do solicitante e, em casos graves, no banimento
              permanente da plataforma. A equipe do Agentic Space reserva-se o
              direito de solicitar provas adicionais a qualquer momento do processo.
            </p>
          </div>
        </div>
      </section>

      <section className="flex flex-wrap gap-4">
        <Link href="/certificado" className="btn-primary">
          <Award size={18} /> Ir para a página de certificado
        </Link>
        <Link href="/certificado/verificar" className="btn-secondary">
          <FileCheck2 size={18} /> Verificar um certificado
        </Link>
      </section>
    </div>
  );
}
