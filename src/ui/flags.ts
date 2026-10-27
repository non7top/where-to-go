// Flag emoji do not render on Windows browsers, so the flags are small SVG images (flag-icons, MIT).
import jp from 'flag-icons/flags/4x3/jp.svg?url';
import kr from 'flag-icons/flags/4x3/kr.svg?url';
import kp from 'flag-icons/flags/4x3/kp.svg?url';
import cn from 'flag-icons/flags/4x3/cn.svg?url';
import tw from 'flag-icons/flags/4x3/tw.svg?url';
import hk from 'flag-icons/flags/4x3/hk.svg?url';
import mo from 'flag-icons/flags/4x3/mo.svg?url';
import mn from 'flag-icons/flags/4x3/mn.svg?url';
import th from 'flag-icons/flags/4x3/th.svg?url';
import vn from 'flag-icons/flags/4x3/vn.svg?url';
import kh from 'flag-icons/flags/4x3/kh.svg?url';
import la from 'flag-icons/flags/4x3/la.svg?url';
import mm from 'flag-icons/flags/4x3/mm.svg?url';
import my from 'flag-icons/flags/4x3/my.svg?url';
import sg from 'flag-icons/flags/4x3/sg.svg?url';
import id from 'flag-icons/flags/4x3/id.svg?url';
import ph from 'flag-icons/flags/4x3/ph.svg?url';
import bn from 'flag-icons/flags/4x3/bn.svg?url';
import tl from 'flag-icons/flags/4x3/tl.svg?url';

const FLAGS: Record<string, string> = { jp, kr, kp, cn, tw, hk, mo, mn, th, vn, kh, la, mm, my, sg, id, ph, bn, tl };

export function flagUrl(countryCode: string): string | undefined {
  return FLAGS[countryCode.toLowerCase()];
}

// Decorative: the country name is always printed next to it.
export function flagImg(countryCode: string): string {
  const url = flagUrl(countryCode);
  return url ? `<img class="flag" src="${url}" alt="" width="20" height="15" loading="lazy">` : '';
}
