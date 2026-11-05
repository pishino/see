import { Link, useLocation, type Location, type LinkProps } from 'react-router-dom';

/** Where a page opened over: the page you were on stays under it (V3ProfileWeb E). */
export function overOf(state: unknown): Location | undefined {
  return (state as { over?: Location } | null)?.over;
}

/** A name that opens its page over where you are; Close goes back. */
export function PersonLink({ handle, ...rest }: Omit<LinkProps, 'to' | 'state'> & { handle: string }) {
  const loc = useLocation();
  return <Link to={`/app/u/${handle}`} state={{ over: overOf(loc.state) ?? loc }} {...rest} />;
}

/** A maker's name (an artist, a director) that opens their page over where you are (V3Objects: the dotted underline). */
export function MakerLink({ name, children, ...rest }: Omit<LinkProps, 'to' | 'state'> & { name: string }) {
  const loc = useLocation();
  return (
    <Link to={`/app/m/${encodeURIComponent(name)}`} state={{ over: overOf(loc.state) ?? loc }} className="name-link" onClick={(e) => e.stopPropagation()} {...rest}>
      {children ?? name}
    </Link>
  );
}
