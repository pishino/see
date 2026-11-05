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
