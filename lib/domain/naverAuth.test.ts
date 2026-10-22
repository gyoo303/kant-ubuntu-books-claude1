import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
    naverAuthorizeUrl,
    naverShadowEmail,
    parseNaverProfile,
    statesMatch,
} from './naverAuth';

describe('naverAuth', () => {
    it('D-042 인가 주소에 client_id·redirect_uri·state·response_type=code가 들어간다', () => {
        const url = new URL(
            naverAuthorizeUrl({
                clientId: 'cid',
                redirectUri: 'http://localhost:3000/api/auth/naver/callback',
                state: 's1',
            }),
        );
        assert.equal(
            url.origin + url.pathname,
            'https://nid.naver.com/oauth2.0/authorize',
        );
        assert.equal(url.searchParams.get('response_type'), 'code');
        assert.equal(url.searchParams.get('client_id'), 'cid');
        assert.equal(
            url.searchParams.get('redirect_uri'),
            'http://localhost:3000/api/auth/naver/callback',
        );
        assert.equal(url.searchParams.get('state'), 's1');
    });

    it('D-042 같은 네이버 id는 같은 내부 이메일, 대소문자만 다른 id는 다른 이메일', () => {
        assert.equal(naverShadowEmail('AbC-1'), naverShadowEmail('AbC-1'));
        assert.notEqual(naverShadowEmail('AbC-1'), naverShadowEmail('abc-1'));
        assert.match(
            naverShadowEmail('AbC-1'),
            /^naver-[0-9a-f]{40}@users\.ubuntubooks\.test$/,
        );
        assert.ok(!naverShadowEmail('AbC-1').includes('AbC-1'));
    });

    it('D-042 네이버 프로필 응답에서 response.id와 닉네임을 읽는다', () => {
        assert.deepEqual(
            parseNaverProfile({
                resultcode: '00',
                message: 'success',
                response: { id: 'n-123', nickname: '책읽는곰' },
            }),
            { id: 'n-123', nickname: '책읽는곰' },
        );
    });

    it('D-042 닉네임이 없으면 빈 문자열, 50자 넘으면 자른다', () => {
        assert.deepEqual(
            parseNaverProfile({ resultcode: '00', response: { id: 'n-1' } }),
            { id: 'n-1', nickname: '' },
        );
        const long = parseNaverProfile({
            resultcode: '00',
            response: { id: 'n-1', nickname: 'ㄱ'.repeat(80) },
        });
        assert.equal(long?.nickname.length, 50);
    });

    it('D-042 실패 응답·id 없음·형식 오류는 null', () => {
        assert.equal(
            parseNaverProfile({
                resultcode: '024',
                message: 'Authentication failed',
            }),
            null,
        );
        assert.equal(
            parseNaverProfile({ resultcode: '00', response: {} }),
            null,
        );
        assert.equal(
            parseNaverProfile({ resultcode: '00', response: { id: 123 } }),
            null,
        );
        assert.equal(
            parseNaverProfile({ resultcode: '00', response: { id: '' } }),
            null,
        );
        assert.equal(parseNaverProfile(null), null);
        assert.equal(parseNaverProfile('x'), null);
    });

    it('D-042 state는 정확히 같을 때만 통과', () => {
        assert.equal(statesMatch('abc', 'abc'), true);
        assert.equal(statesMatch('abc', 'abd'), false);
        assert.equal(statesMatch('abc', 'abcd'), false);
        assert.equal(statesMatch(undefined, 'abc'), false);
        assert.equal(statesMatch('abc', undefined), false);
        assert.equal(statesMatch('', ''), false);
    });
});
