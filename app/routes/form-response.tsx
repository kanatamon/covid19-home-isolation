import { Link } from '@remix-run/react'
import QRCode from 'qrcode.react'
import { useLIFFUtilsBeforeInit } from '~/hooks/useLIFF/useLIFFUtilsBeforeInit'

const linkToGroup = 'https://liff.line.me/1645278921-kWRPP32q/?accountId=510lxrso'

export default function FormResponseRoute() {
  const liffUtils = useLIFFUtilsBeforeInit()

  return (
    <div
      style={{
        padding: '32px 24px',
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontSize: 20,
        gap: '1.5rem',
      }}
    >
      <h1 style={{ margin: 0 }}>ท่านลงทะเบียนในขั้นตอน ระบุพิกัด ที่พัก สำเร็จ!!!</h1>
      <p style={{ width: '100%', margin: 0 }}>ขั้นตอนต่อไป โปรดทำตามขั้นตอน</p>
      <ol
        style={{
          margin: 0,
          paddingLeft: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        <li>ให้ใช้ Police line (เส้นกั้นขาวแดงผูกหน้าบ้าน 2 เสา)</li>
        <li>เอาโต๊ะ หรือ เก้าอี้ มาวาง หน้าสุดของบริเวณที่พัก เพื่อ รอการ ส่งกล่องยา/อาหาร</li>
        {liffUtils.deviceEnv !== 'liff' ? (
          <li>
            ให้สแกน QR Code ด่านล่างเพื่อ เข้ากลุ่ม line รายงานตัว เพื่อใช้ รายงานผลการวัดไข้และค่า
            ออกซิเจนปลายนิ้ว ประจำวัน
          </li>
        ) : null}
        <li>ถ้ายังไม่ได้รับ กล่องยา ภายใน 18.00น. แจ้งในไลน์ข้างต้น หรือ 092-5947209</li>
        <li>การวัดไข้และค่าออกซิเจนปลายนิ้ว ให้รายงานผลให้ไลน์ เวลา 07.00น. และ 15.00น. ทุกวัน</li>
      </ol>
      {liffUtils.deviceEnv !== 'liff' ? (
        <>
          <QRCode value={linkToGroup} size={196} />
          <p
            style={{
              margin: 0,
              fontSize: '1rem',
            }}
          >
            หรือ
          </p>
          <a
            href={linkToGroup}
            style={{
              color: '#06c755',
              textDecoration: 'none',
              border: '1px solid grey',
              borderRadius: 4,
              fontSize: '1rem',
              padding: '12px 16px',
            }}
          >
            กดที่นี้เพื่อเข้ากลุ่ม Line - HI รพ.ค่ายเทพฯ
          </a>
          <div style={{ height: '1.25rem' }} />
          <Link
            to="/"
            style={{
              fontSize: '1rem',
            }}
          >
            ส่งแบบฟอร์มเพิ่ม
          </Link>{' '}
        </>
      ) : (
        <button onClick={liffUtils.closeApp}>Close</button>
      )}
    </div>
  )
}
