'use client';

/**
 * @file EventAttendanceForm.js
 * @description Componente genérico que exibe um formulário de presença
 * embutido quando o horário atual atende às condições configuradas no
 * frontmatter do evento.
 *
 * A lógica de horário foi extraída da antiga página
 * /eventos/encontros-quintas-21h e parametrizada via props.
 */

import { useState, useEffect } from 'react';
import { ClipboardList } from 'lucide-react';

const WEEKDAY_NAMES = {
  Mon: 'segunda-feira',
  Tue: 'terça-feira',
  Wed: 'quarta-feira',
  Thu: 'quinta-feira',
  Fri: 'sexta-feira',
  Sat: 'sábado',
  Sun: 'domingo',
};

/**
 * Converte um horário "HH:MM" para minutos a partir da meia-noite.
 * @param {string} time
 * @returns {number}
 */
function timeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Verifica se o horário atual, no fuso configurado, está dentro do intervalo
 * e dia da semana esperados.
 *
 * @param {Object} config
 * @param {string} config.timezone - Fuso horário (ex: "America/Fortaleza").
 * @param {string} config.weekday - Dia da semana abreviado em inglês (ex: "Thu").
 * @param {string} config.startTime - Horário de início (ex: "21:30").
 * @param {string} config.endTime - Horário de término (ex: "23:59").
 * @returns {boolean}
 */
function isWithinAttendanceWindow({ timezone, weekday, startTime, endTime }) {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(now);

    let currentWeekday = '';
    let currentHour = 0;
    let currentMinute = 0;

    for (const part of parts) {
      if (part.type === 'weekday') currentWeekday = part.value;
      if (part.type === 'hour') currentHour = parseInt(part.value, 10);
      if (part.type === 'minute') currentMinute = parseInt(part.value, 10);
    }

    const currentTime = currentHour * 60 + currentMinute;
    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);

    return currentWeekday === weekday && currentTime >= start && currentTime <= end;
  } catch {
    return false;
  }
}

export default function EventAttendanceForm({
  config,
  title = 'Formulário de Presença',
  description = 'Preencha o formulário abaixo para registrar sua presença e garantir seu certificado de participação:',
}) {
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!config?.enabled || !config.formUrl) {
      return undefined;
    }

    const check = () => {
      setShowForm(isWithinAttendanceWindow(config));
    };

    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [config]);

  if (!config?.enabled || !config.formUrl) {
    return null;
  }

  if (!showForm) {
    const weekdayName = WEEKDAY_NAMES[config.weekday] || config.weekday;
    return (
      <section className="card space-y-6">
        <div className="flex items-center gap-3">
          <ClipboardList className="text-brand-400" size={28} />
          <h2 className="text-2xl font-bold text-white">{title}</h2>
        </div>
        <p className="text-slate-300">
          O formulário de presença ficará disponível{' '}
          <strong className="text-white">{config.weekday ? `nas ${weekdayName}s` : 'em breve'}</strong>,{' '}
          das <strong className="text-white">{config.startTime}</strong> às{' '}
          <strong className="text-white">{config.endTime}</strong> (fuso{' '}
          {config.timezone}).
        </p>
      </section>
    );
  }

  return (
    <section className="card space-y-6">
      <div className="flex items-center gap-3">
        <ClipboardList className="text-brand-400" size={28} />
        <h2 className="text-2xl font-bold text-white">{title}</h2>
      </div>
      <p className="text-slate-300">{description}</p>
      <div className="w-full">
        <iframe
          src={config.formUrl}
          width="100%"
          height="1772"
          frameBorder="0"
          marginHeight="0"
          marginWidth="0"
          title={title}
          className="rounded-lg"
        >
          Carregando…
        </iframe>
      </div>
    </section>
  );
}
