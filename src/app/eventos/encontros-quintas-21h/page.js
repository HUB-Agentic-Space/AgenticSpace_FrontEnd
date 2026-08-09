'use client';

/**
 * @file page.js (rota '/eventos/encontros-quintas-21h')
 * @description Página do evento "Encontros de Quinta - 21:00".
 *
 * Toda quinta-feira às 21:00 acontece um encontro online para conversar
 * sobre a CAS — Cripto Moeda Agentic Space — e conceitos de Blockchain,
 * Smart Contracts e criptomoedas. Participantes com presença >= 50%
 * recebem certificado.
 */

import { useState, useEffect } from 'react';
import { Calendar, Clock, Award, Video, FileText, ExternalLink, Phone, Globe, MapPin, ClipboardList, Mail, MessageCircle, BadgeCheck } from 'lucide-react';

export default function EncontrosQuintasPage() {
  const googleCalendarLink =
    'https://calendar.google.com/calendar/event?action=TEMPLATE&tmeid=MGNwaDA3bjJuZGIyb3Q5M2N2cGdkdTdha3ZfMjAyNjA4MTRUMDAwMDAwWiBjX2E1MzRmYTZlYjE4ZTQxNmU0NjMzNmE1OTVhNmY0ZDg5MTM0NWUzYzdhYTk2ZmZiZWE0ZDYzNTYwYzM5MDIzMjhAZw&tmsrc=c_a534fa6eb18e416e46336a595a6f4d891345e3c7aa96ffbea4d63560c3902328%40group.calendar.google.com&scp=ALL';

  const [showForm, setShowForm] = useState(false);
  const [formUrl, setFormUrl] = useState('');

  useEffect(() => {
    const _0x4e3a = ['\x41\x6d\x65\x72\x69\x63\x61\x2f\x46\x6f\x72\x74\x61\x6c\x65\x7a\x61','\x65\x6e\x2d\x55\x53','\x54\x68\x75','\x73\x68\x6f\x72\x74','\x32\x2d\x64\x69\x67\x69\x74','\x6d\x69\x6e\x75\x74\x65','\x68\x6f\x75\x72','\x77\x65\x65\x6b\x64\x61\x79','\x68\x74\x74\x70\x73\x3a\x2f\x2f\x64\x6f\x63\x73\x2e\x67\x6f\x6f\x67\x6c\x65\x2e\x63\x6f\x6d\x2f\x66\x6f\x72\x6d\x73\x2f\x64\x2f\x65\x2f\x31\x46\x41\x49\x70\x51\x4c\x53\x64\x70\x69\x6c\x39\x38\x34\x71\x63\x77\x69\x70\x6c\x74\x54\x54\x6b\x50\x33\x75\x6a\x54\x4a\x6e\x4d\x6f\x49\x4d\x6d\x38\x78\x49\x52\x49\x4d\x41\x51\x53\x4f\x6f\x63\x5a\x2d\x5f\x79\x2d\x54\x67\x2f\x76\x69\x65\x77\x66\x6f\x72\x6d\x3f\x65\x6d\x62\x65\x64\x64\x65\x64\x3d\x74\x72\x75\x65'];
    const checkSchedule = () => {
      try {
        const _0x1f = new Date();
        const _0x2a = new Intl.DateTimeFormat(_0x4e3a[1], {
          timeZone: _0x4e3a[0],
          weekday: _0x4e3a[3],
          hour: _0x4e3a[4],
          minute: _0x4e3a[4],
          hour12: false,
        });
        const _0x3b = _0x2a.formatToParts(_0x1f);
        let _0x5c = '', _0x6d = 0, _0x7e = 0;
        for (let _0x8 = 0; _0x8 < _0x3b.length; _0x8++) {
          if (_0x3b[_0x8].type === _0x4e3a[7]) _0x5c = _0x3b[_0x8].value;
          if (_0x3b[_0x8].type === _0x4e3a[6]) _0x6d = parseInt(_0x3b[_0x8].value, 10);
          if (_0x3b[_0x8].type === _0x4e3a[5]) _0x7e = parseInt(_0x3b[_0x8].value, 10);
        }
        const _0x9f = _0x5c === _0x4e3a[2];
        const _0xa0 = _0x6d * 60 + _0x7e;
        const _0xb1 = 21 * 60 + 30;
        const _0xc2 = 23 * 60 + 59;
        const _0xd4 = _0x9f && _0xa0 >= _0xb1 && _0xa0 <= _0xc2;
        setShowForm(_0xd4);
        if (_0xd4) setFormUrl(_0x4e3a[8]);
        else setFormUrl('');
      } catch {
        setShowForm(false);
        setFormUrl('');
      }
    };
    checkSchedule();
    const _0xd3 = setInterval(checkSchedule, 60000);
    return () => clearInterval(_0xd3);
  }, []);

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="text-center space-y-6">
        <div className="flex justify-center">
          <Calendar className="text-brand-400" size={48} />
        </div>
        <h1 className="text-4xl font-bold text-white">
          Encontros de Quinta — 21:00
        </h1>
        <p className="text-lg text-slate-400 max-w-3xl mx-auto">
          Toda quinta-feira, às 21h, nos reunimos para conversar sobre a
          CAS — Cripto Moeda Agentic Space — e explorar juntos o universo da
          Blockchain.
        </p>
      </section>

      {/* Adicionar ao Google Calendar */}
      <section className="card space-y-6">
        <div className="flex items-center gap-3">
          <Clock className="text-brand-400" size={28} />
          <h2 className="text-2xl font-bold text-white">Próximo Encontro</h2>
        </div>
        <p className="text-slate-300">
          Adicione o evento ao seu Google Calendar e receba um lembrete
          automático para não perder:
        </p>
        <div className="flex justify-center">
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={googleCalendarLink}
            className="btn-primary"
          >
            <ExternalLink size={18} />
            Adicionar ao Google Calendar
          </a>
        </div>
      </section>

      {/* Como Participar do Google Meet */}
      <section className="card space-y-6">
        <div className="flex items-center gap-3">
          <Video className="text-brand-400" size={28} />
          <h2 className="text-2xl font-bold text-white">Como Participar do Google Meet</h2>
        </div>
        <div className="space-y-4 text-slate-300">
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-brand-400" />
            <span>
              <strong className="text-white">Fuso horário:</strong>{' '}
              America/Fortaleza (UTC-3)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-brand-400" />
            <span>
              <strong className="text-white">Link da videochamada:</strong>{' '}
              <a
                href="https://meet.google.com/bph-jgjv-ieg"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-400 hover:text-brand-300 underline"
              >
                https://meet.google.com/bph-jgjv-ieg
              </a>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Phone size={18} className="text-brand-400" />
            <span>
              <strong className="text-white">Ou disque:</strong>{' '}
              (BR) +55 31 3958-9650 — PIN: 594 304 549#
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Phone size={18} className="text-brand-400" />
            <span>
              <strong className="text-white">Outros números de telefone:</strong>{' '}
              <a
                href="https://tel.meet/bph-jgjv-ieg?pin=9720630469237"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-400 hover:text-brand-300 underline"
              >
                https://tel.meet/bph-jgjv-ieg?pin=9720630469237
              </a>
            </span>
          </div>
        </div>
      </section>

      {/* Sobre os Encontros */}
      <section className="card space-y-6">
        <div className="flex items-center gap-3">
          <Video className="text-brand-400" size={28} />
          <h2 className="text-2xl font-bold text-white">Sobre os Encontros</h2>
        </div>
        <div className="space-y-4 text-slate-300">
          <p>
            Os <strong className="text-white">Encontros de Quinta</strong> são
            sessões online e gratuitas, realizadas toda quinta-feira às{' '}
            <strong className="text-white">21:00</strong>, onde conversamos sobre
            a <strong className="text-white">CAS — Cripto Moeda Agentic Space</strong>,
            sua utilidade, governança e ecossistema.
          </p>
          <p>
            Além da CAS, os encontros abordam conceitos fundamentais ligados a{' '}
            <strong className="text-white">Blockchain</strong>, contribuindo com
            a disseminação e o entendimento de Criptomoedas, Smart Contracts e
            tecnologia blockchain de forma prática e acessível.
          </p>
          <p>
            É um espaço aberto para tirar dúvidas, compartilhar experiências e
            aprender em comunidade — seja você iniciante ou experiente no mundo
            cripto.
          </p>
          <div className="bg-slate-800/50 p-4 rounded-lg border-l-4 border-brand-500">
            <p>
              <strong className="text-white">Gravação:</strong> O encontro é
              gravado e a gravação será disponibilizada apenas para os
              participantes que informarem o seu <strong className="text-white">e-mail</strong>{' '}
              e preencherem o <strong className="text-white">formulário de
              presença</strong> durante o evento.
            </p>
          </div>
          <div className="bg-slate-800/50 p-4 rounded-lg border-l-4 border-brand-500">
            <p>
              <strong className="text-white">Lista de presença obrigatória:</strong>{' '}
              A partir do dia <strong className="text-white">13 de agosto de 2026</strong>,
              o preenchimento da lista de presença passa a ser{' '}
              <strong className="text-white">obrigatório</strong> para receber o
              certificado de participação.
            </p>
            <p className="mt-2">
              <strong className="text-white">Senhas de verificação:</strong>{' '}
              Durante a live serão informadas <strong className="text-white">duas
              senhas</strong> que devem ser preenchidas no formulário:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-slate-400">
              <li>
                <strong className="text-white">1ª senha:</strong> aproximadamente{' '}
                <strong className="text-white">21:30</strong>
              </li>
              <li>
                <strong className="text-white">2ª senha:</strong> aproximadamente{' '}
                <strong className="text-white">21:55</strong>
              </li>
            </ul>
            <p className="mt-2">
              É <strong className="text-white">fundamental</strong> informar as
              duas senhas para garantir o recebimento do certificado.
            </p>
          </div>
        </div>
      </section>

      {/* Certificado de Participação */}
      <section className="card space-y-6">
        <div className="flex items-center gap-3">
          <Award className="text-brand-400" size={28} />
          <h2 className="text-2xl font-bold text-white">
            Certificado de Participação
          </h2>
        </div>
        <div className="space-y-4 text-slate-300">
          <p>
            Todos os participantes que comparecerem a pelo menos{' '}
            <strong className="text-white">50% do encontro</strong> terão direito
            a receber um <strong className="text-white">certificado de
            participação</strong>, emitido on-chain como NFT via o contrato
            RapportCertificate.
          </p>
          <p>
            A partir do dia <strong className="text-white">13 de agosto de 2026</strong>,
            o preenchimento da lista de presença passa a ser{' '}
            <strong className="text-white">obrigatório</strong>. Durante o encontro
            serão informadas <strong className="text-white">duas senhas de
            verificação</strong> (aproximadamente às <strong className="text-white">21:30</strong>{' '}
            e <strong className="text-white">21:55</strong>) que devem ser
            preenchidas no formulário. Sem as duas senhas, o certificado não
            será emitido.
          </p>
        </div>
      </section>

      {/* Como Participar */}
      <section className="card space-y-6">
        <div className="flex items-center gap-3">
          <FileText className="text-brand-400" size={28} />
          <h2 className="text-2xl font-bold text-white">Como Participar</h2>
        </div>
        <ol className="list-decimal list-inside space-y-3 text-slate-300">
          <li>
            <a
              href={googleCalendarLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-400 hover:text-brand-300 underline"
            >
              Clique aqui
            </a>{' '}
            para agendar o evento e receber o link de acesso.
          </li>
          <li>
            Entre no encontro na quinta-feira às <strong className="text-white">21:00</strong>.
          </li>
          <li>
            Preencha o <strong className="text-white">formulário de presença</strong>{' '}
            disponibilizado durante a sessão.
          </li>
          <li>
            Participe de pelo menos <strong className="text-white">50% do
            encontro</strong> para garantir seu certificado.
          </li>
        </ol>
      </section>

      {/* Formulário de Presença — visível apenas quintas 21:30–23:59 */}
      {showForm && formUrl && (
        <section className="card space-y-6">
          <div className="flex items-center gap-3">
            <ClipboardList className="text-brand-400" size={28} />
            <h2 className="text-2xl font-bold text-white">Formulário de Presença</h2>
          </div>
          <p className="text-slate-300">
            Preencha o formulário abaixo para registrar sua presença no
            encontro de hoje e garantir seu certificado de participação:
          </p>
          <div className="w-full">
            <iframe
              src={formUrl}
              width="100%"
              height="1772"
              frameBorder="0"
              marginHeight="0"
              marginWidth="0"
              title="Formulário de Presença — Encontros de Quinta"
              className="rounded-lg"
            >
              Carregando…
            </iframe>
          </div>
        </section>
      )}

      {/* Já emitiu seu certificado? */}
      <section className="card space-y-6">
        <div className="flex items-center gap-3">
          <BadgeCheck className="text-brand-400" size={28} />
          <h2 className="text-2xl font-bold text-white">
            Já emitiu seu certificado do último encontro?
          </h2>
        </div>
        <div className="space-y-4 text-slate-300">
          <p>
            Se você participou de um encontro anterior e ainda não emitiu seu{' '}
            <strong className="text-white">certificado de participação</strong>,
            acesse agora a página de certificados para verificar e emitir o seu:
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="/certificado"
              className="btn-primary"
            >
              <BadgeCheck size={18} />
              Emitir / Verificar Certificado
            </a>
          </div>
          <div className="bg-slate-800/50 p-4 rounded-lg border-l-4 border-brand-500 space-y-3">
            <p className="text-white font-medium">
              Ficou com alguma dúvida?
            </p>
            <div className="flex flex-wrap gap-6">
              <a
                href="https://wa.me/5585985205490"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-brand-400 hover:text-brand-300"
              >
                <MessageCircle size={20} />
                WhatsApp: (85) 98520-5490
              </a>
              <a
                href="mailto:certificados@rapport.tec.br"
                className="flex items-center gap-2 text-brand-400 hover:text-brand-300"
              >
                <Mail size={20} />
                certificados@rapport.tec.br
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
