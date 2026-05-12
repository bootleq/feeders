import Link from 'next/link';

export default async function SideNav() {
  return (
    <ul className="flex flex-col mt-4 ml-5 p-3 list-disc list-outside">
      <li>
        <Link href='/about/' className="p-1 rounded-md hover:bg-amber-200">關於本站</Link>
      </li>
      <li>
        <Link href='/about/term/' className="p-1 rounded-md hover:bg-amber-200">使用條款</Link>
      </li>
    </ul>
  );
}
