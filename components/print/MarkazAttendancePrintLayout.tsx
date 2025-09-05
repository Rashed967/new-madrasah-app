
import React from 'react';
import { BoardProfile } from '../../types';

interface MarhalaData {
  count: number;
  rolls: number[];
}

interface MadrasaRow {
  madrasa_name: string;
  ilhak_no: number;
  total_students_in_madrasa: number;
  marhala_data: Record<string, MarhalaData>; // key is marhala_id
}

interface MarkazData {
  markaz_id: string;
  markaz_code: string;
  host_madrasa_info: string;
  total_written: number;
  total_oral: number;
  madrasa_rows: MadrasaRow[];
  all_marhalas_in_markaz: { id: string; name: string }[];
}

interface MarkazAttendancePrintLayoutProps {
  reportData: {
    board_profile: BoardProfile;
    exam_name: string;
    zone_name?: string;
    markazes: MarkazData[];
  }
}

export const MarkazAttendancePrintLayout: React.FC<MarkazAttendancePrintLayoutProps> = ({ reportData }) => {
  const { board_profile, exam_name, zone_name, markazes } = reportData;

  const renderRolls = (rolls: number[]) => {
    if (!rolls || rolls.length === 0) return '';

    rolls.sort((a, b) => a - b);

    const ranges = rolls.reduce((acc, roll) => {
      if (acc.length > 0 && roll === acc[acc.length - 1].end + 1) {
        acc[acc.length - 1].end = roll;
      } else {
        acc.push({ start: roll, end: roll });
      }
      return acc;
    }, [] as { start: number; end: number }[]);

    return ranges
      .map(range => 
        range.start === range.end 
          ? range.start.toLocaleString('bn-BD') 
          : `${range.start.toLocaleString('bn-BD')}-${range.end.toLocaleString('bn-BD')}`
      )
      .join(' ও ');
  };
  
  return (
    <div className="printable-content bg-white p-2" style={{ fontFamily: "'SolaimanLipi', 'Noto Sans Bengali', sans-serif" }}>
       <style>{`
        .attendance-page {
          page-break-after: always;
          margin-bottom: 10mm; /* Added to prevent overlap */
          color: black;
          font-size: 10pt;
          line-height: 1.3;
        }
        .attendance-page:last-child {
          page-break-after: auto;
        }
        .attendance-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 5px;
        }
        .attendance-table th, .attendance-table td {
          border: 1px solid black !important;
          padding: 4px 4px;
          text-align: center;
          vertical-align: middle;
        }
        .attendance-table th { font-weight: bold; }
        .attendance-table .text-right { text-align: right; }
        .attendance-table .text-left { text-align: left; }
        .attendance-table .roll-cell { font-size: 8pt; line-height: 1.2; text-align: center; }
        .attendance-header, .markaz-header { text-align: center; }
        .board-name { font-size: 16pt; font-weight: bold; }
        .exam-name { font-size: 14pt; font-weight: bold; }
        .zone-name { font-size: 12pt; font-weight: bold; }
        .markaz-info { font-size: 11pt; }
        .total-summary { font-weight: bold; }
       `}</style>
      
      {markazes.map((markaz, index) => {
        const marhalaTotalCounts = markaz.all_marhalas_in_markaz.map(marhala => {
            return markaz.madrasa_rows.reduce((acc, row) => acc + (row.marhala_data[marhala.id]?.count || 0), 0);
        });

        const totalStudentsInMarkaz = markaz.madrasa_rows.reduce((acc, row) => acc + row.total_students_in_madrasa, 0);

        return (
        <div key={markaz.markaz_id} className="attendance-page">
          <header className="attendance-header mb-2">
            <h1 className="board-name">{board_profile.boardNameBn}</h1>
            <h2 className="exam-name">{exam_name}</h2>
            {zone_name && <h3 className="zone-name">জোন নং: {zone_name}</h3>}
          </header>
          
          <section className="markaz-header mb-2">
            <h4 className="markaz-info font-bold">{markaz.markaz_code} নং মারকায: {markaz.host_madrasa_info}</h4>
          </section>

          <table className="attendance-table">
            <thead>
              <tr>
                <th rowSpan={2} style={{ width: '4%'}}>ক্র.</th>
                <th rowSpan={2} style={{ width: '25%'}}>মাদরাসার নাম</th>
                <th rowSpan={2} style={{ width: '8%'}}>ইলহাকী নং</th>
                <th rowSpan={2} style={{ width: '8%'}}>মোট ছাত্র সংখ্যা</th>
                {markaz.all_marhalas_in_markaz.map(marhala => (
                  <th key={marhala.id} colSpan={1}>{marhala.name}</th>
                ))}
              </tr>

            </thead>
            <tbody>
              {markaz.madrasa_rows.map((row, rowIndex) => (
                <React.Fragment key={row.ilhak_no}>
                  <tr>
                    <td rowSpan={2} className="align-middle">{(rowIndex + 1).toLocaleString('bn-BD')}</td>
                    <td rowSpan={2} className="text-left align-middle">{row.madrasa_name}</td>
                    <td rowSpan={2} className="align-middle">{row.ilhak_no.toLocaleString('bn-BD')}</td>
                    <td rowSpan={2} className="align-middle">{row.total_students_in_madrasa.toLocaleString('bn-BD')}</td>
                    {markaz.all_marhalas_in_markaz.map(marhala => (
                      <td key={`${marhala.id}-count`} className="font-bold">
                        {row.marhala_data[marhala.id]?.count === 0 ? '' : (row.marhala_data[marhala.id]?.count || '').toLocaleString('bn-BD')}
                      </td>
                    ))}
                  </tr>
                  <tr>
                     {markaz.all_marhalas_in_markaz.map(marhala => (
                      <td key={`${marhala.id}-rolls`} className="roll-cell text-center">
                        {renderRolls(row.marhala_data[marhala.id]?.rolls || [])}
                      </td>
                    ))}
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
            <tfoot>
              <tr className="total-summary">
                <td colSpan={3} className="text-right font-bold">মোট পরীক্ষার্থী</td>
                <td className="font-bold">{totalStudentsInMarkaz.toLocaleString('bn-BD')}</td>
                {marhalaTotalCounts.map((count, i) => (
                    <td key={i} className="font-bold">{count.toLocaleString('bn-BD')}</td>
                ))}
              </tr>
              <tr>
                <td colSpan={markaz.all_marhalas_in_markaz.length + 4} className="text-center p-2 total-summary">
                    মোট পরীক্ষার্থী সংখ্যা: {(markaz.total_written + markaz.total_oral).toLocaleString('bn-BD')} | 
                    লিখিত পরীক্ষার্থী সংখ্যা: {markaz.total_written.toLocaleString('bn-BD')} | 
                    মৌখিক পরীক্ষার্থী সংখ্যা: {markaz.total_oral.toLocaleString('bn-BD')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )})}
    </div>
  );
};
