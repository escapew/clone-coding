import React, { useCallback, useEffect, useState } from 'react';
import { Link, Redirect } from 'react-router-dom';
import axios from 'axios';
import { Button, Error, Form, Header, Input, Label, LinkContainer, Success } from './styles';
import inputUser from '../../hooks/inputUser';
import useSWR from 'swr';
import fetcher from '@src/utils/fetcher';

function SignUp(){
    const {data} = useSWR('http://localhost:3095/api/users', fetcher);
    const [email, onChangeEmail] =  inputUser('');
    const [nickname, onChangeNickname] = inputUser('');
    const [password, onChangePassword] = inputUser('');
    const [passwordCheck, onChangePasswordCheck] = inputUser('');
    const [mismatchError, setMismatchError] = useState(false);
    const [signUpError, setSignUpError] = useState('');
    const [signUpSuccess, setSignUpSuccess] = useState(false);

    useEffect(() => {
      if(password!=='' && passwordCheck!=='') setMismatchError(password!==passwordCheck);
    },[password, passwordCheck]);
    
    const onSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        setSignUpSuccess(false);
        setSignUpError('');

        if(!mismatchError && nickname && email && password){
            console.log('회원가입 요청');

            const response = axios.post('http://localhost:3095/api/users',{
              email,
              nickname,
              password
            });

            response
            .then((res) => {
              setSignUpSuccess(true);
            })
            .catch((error) => {
              setSignUpError(error.response.data);
            })
        }
    },[email, nickname, password, passwordCheck, mismatchError]);

    if(data){
      return <Redirect to='/workspace/sleact/channel/일반' />
    }
    return (
      <div id="container">
        <Header>Sleact</Header>
        <Form  onSubmit={onSubmit}>
           <Label id="email-label">
            <span>이메일 주소</span>
            <div>
              <Input type="email" id="email" name="email" value={email} onChange={onChangeEmail} />
            </div>
          </Label>
          <Label id="nickname-label">
            <span>닉네임</span>
            <div>
              <Input type="text" id="nickname" name="nickname" value={nickname} onChange={onChangeNickname} />
            </div>
          </Label>
          <Label id="password-label">
            <span>비밀번호</span>
            <div>
              <Input type="password" id="password" name="password" value={password} onChange={onChangePassword} />
            </div>
          </Label>
           <Label id="password-check-label">
            <span>비밀번호 확인</span>
            <div>
              <Input
                type="password"
                id="password-check"
                name="password-check"
                value={passwordCheck}
                onChange={onChangePasswordCheck}
              />
            </div>
            {mismatchError && <Error>비밀번호가 일치하지 않습니다.</Error>}
            {!nickname && <Error>닉네임을 입력해주세요.</Error>}
            {signUpError && <Error>{signUpError}</Error>}
            {signUpSuccess && <Success>회원가입되었습니다! 로그인해주세요.</Success>}
          </Label> 
          <Button type="submit">회원가입</Button>
        </Form>
        <LinkContainer>
          이미 회원이신가요?&nbsp;
          <Link to="/login">로그인 하러가기</Link>
        </LinkContainer>
      </div>
    );
  };
  
  export default SignUp;