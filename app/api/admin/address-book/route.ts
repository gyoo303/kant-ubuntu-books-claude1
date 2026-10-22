// API-27 주소록 엑셀 (관리자) — ADR-008, 서버에 파일을 남기지 않고 바로 응답한다 (RISK-07)
import ExcelJS from 'exceljs';
import { requireAdmin } from '@/lib/api/auth';
import { fail } from '@/lib/api/http';
import { logServerError } from '@/lib/api/errors';
import { todayKst } from '@/lib/domain/billing';
import { getAddressBookRows } from '@/lib/data/addressBook';

export async function GET() {
    const auth = await requireAdmin();
    if (auth instanceof Response) return auth;

    try {
        const rows = await getAddressBookRows();
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('주소록');
        sheet.columns = [
            { header: '이름', key: 'recipientName', width: 14 },
            { header: '연락처', key: 'phone', width: 16 },
            { header: '우편번호', key: 'postalCode', width: 10 },
            { header: '주소', key: 'address1', width: 40 },
            { header: '상세주소', key: 'address2', width: 24 },
        ];
        // 우편번호 앞자리 0·연락처가 숫자로 바뀌지 않게 모든 칸을 텍스트로
        for (const column of sheet.columns) column.numFmt = '@';
        sheet.getRow(1).font = { bold: true };
        for (const row of rows) sheet.addRow(row);

        const buffer = await workbook.xlsx.writeBuffer();
        const filename = `ubuntubooks-address-book-${todayKst(new Date()).replaceAll('-', '')}.xlsx`;
        return new Response(buffer, {
            headers: {
                'Content-Type':
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Cache-Control': 'no-store',
            },
        });
    } catch (error) {
        logServerError('API-27', error);
        return fail('INTERNAL');
    }
}
