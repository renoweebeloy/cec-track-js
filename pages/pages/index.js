import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ padding: '20px', textFont: 'sans-serif' }}>
      <h1>Welcome to CEC Track</h1>
      <p>Select a page to visit:</p>
      <ul>
        <li><Link href="/login">Login</Link></li>
        <li><Link href="/scanner">Scanner</Link></li>
        <li><Link href="/dashboard">Dashboard</Link></li>
      </ul>
    </div>
  );
}
