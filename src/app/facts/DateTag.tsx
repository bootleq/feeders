const commonProps = {
  'data-role': 'fact-date',
  itemProp: 'contentReferenceTime',
};

export default function DateTag({ date, ...props }: {
  date: string,
  [key: string]: any,
}) {
  const dateDisplay = date.replace(/^0*/, '');
  const datePadEnd = dateDisplay.length < 10 ? <span className=''>{'\u00A0'.repeat(10 - dateDisplay.length)}</span> : '';

  if (dateDisplay.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return (
      <time {...commonProps} {...props}>{dateDisplay}</time>
    );
  } else {
    return (
      <div {...commonProps} {...props}>
        {dateDisplay}{datePadEnd}
      </div>
    );
  }
}
