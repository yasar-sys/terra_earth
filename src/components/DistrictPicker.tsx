import { useNavigate } from '@tanstack/react-router';
import { LocationSearch } from './LocationSearch';
import { useLang } from '@/lib/i18n';
export function DistrictPicker(){const navigate=useNavigate();const {lang}=useLang();return <section aria-labelledby="picker-heading" className="mx-auto max-w-3xl py-4"><h2 id="picker-heading" className="mb-3 font-display text-xl">{lang==='bn'?'পৃথিবীর একটি স্থান বেছে নিন':'Choose a place on Earth'}</h2><LocationSearch onSelect={districtId=>void navigate({to:'/district/$districtId',params:{districtId}})}/></section>;}
