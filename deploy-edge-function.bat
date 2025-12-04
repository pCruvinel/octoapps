@echo off
echo ========================================
echo  DEPLOY DA EDGE FUNCTION - BACEN TAXA
echo ========================================
echo.

REM Configurar o token de acesso
set SUPABASE_ACCESS_TOKEN=sbp_83799a46393bd3c576262b786073e0be66fae4ec

echo [1/2] Configurando token de acesso...
echo Token configurado!
echo.

echo [2/2] Fazendo deploy da funcao buscar-taxa-bacen...
supabase functions deploy buscar-taxa-bacen --project-ref uyeubtqxwrhpuafcpgtg

echo.
echo ========================================
if %ERRORLEVEL% EQU 0 (
    echo  DEPLOY CONCLUIDO COM SUCESSO!
    echo ========================================
    echo.
    echo A funcao esta disponivel em:
    echo https://uyeubtqxwrhpuafcpgtg.supabase.co/functions/v1/buscar-taxa-bacen
    echo.
    echo Agora voce pode testar no app!
) else (
    echo  ERRO NO DEPLOY!
    echo ========================================
    echo.
    echo Verifique os logs acima para detalhes.
)

echo.
pause
