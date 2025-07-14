# Windows 서비스 등록 장점 및 방법

Windows 서비스로 등록하면 다음과 같은 장점이 있습니다:

* **백그라운드 실행**: 사용자가 로그인하지 않아도 시스템 시작 시 자동으로 실행됩니다.
* **지속적인 실행**: 애플리케이션이 충돌하거나 종료되어도 자동으로 재시작되도록 설정할 수 있습니다.
* **중앙 관리**: Windows 서비스 관리자(`services.msc`)를 통해 시작, 중지, 재시작 등을 쉽게 관리할 수 있습니다.

Windows 서비스를 등록하는 방법은 여러 가지가 있지만, 가장 일반적이고 편리한 두 가지 방법을 안내해 드리겠습니다.

-----

## 방법 1: NSSM (Non-Sucking Service Manager) 사용 (권장)

NSSM은 어떤 실행 파일이든 Windows 서비스로 쉽게 등록하고 관리할 수 있게 해주는 강력하고 유연한 오픈소스 도구입니다. 자동 재시작, 환경 변수 설정, 로그 리디렉션 등 다양한 기능을 제공합니다.

### 1\. NSSM 다운로드

* **NSSM 공식 웹사이트** ([http://nssm.cc/](http://nssm.cc/))에서 최신 버전을 다운로드합니다.
* 다운로드한 ZIP 파일의 압축을 풀고, 시스템 아키텍처에 맞는 `nssm.exe` 파일(일반적으로 `win64` 폴더 안)을 찾습니다. 이 파일을 `log-tailor.exe`와 같은 폴더에 두거나, 시스템 PATH에 추가된 폴더(예: `C:\Windows\System32`)에 복사해두면 편리합니다.

### 2\. 서비스 설치

* **관리자 권한**으로 명령 프롬프트(CMD) 또는 PowerShell을 엽니다.
* 다음 명령어를 실행하여 NSSM GUI를 띄웁니다:
  ```bash
  nssm install <서비스_이름>
  ```
  **예시:** `nssm install LogTailorService`
* NSSM GUI 창이 나타나면 다음을 설정합니다:
    * **Path**: `log-tailor.exe` 파일의 **절대 경로**를 지정합니다 (예: `C:\Shock\workspace\log-tailor\log-tailor.exe`).
    * **Arguments**: `--log-file "C:\path\to\your\log.txt"` 와 같이 로그 파일 경로 인자를 지정합니다. (경로에 공백이 있다면 큰따옴표로 묶어야 합니다.)
    * **Details 탭**: 서비스 이름, 표시 이름 등을 설정합니다.
    * **Logon 탭**: 서비스가 실행될 계정을 설정합니다 (일반적으로 `Local System account`로 충분합니다).
    * **I/O 탭**: 표준 출력(stdout)과 표준 에러(stderr)를 파일로 리디렉션하여 서비스 로그를 확인할 수 있도록 설정하는 것이 좋습니다. (예: `Output (stdout)`에 `C:\Shock\workspace\log-tailor\service_output.log` 지정)
    * **Exit actions 탭**: 서비스가 종료되었을 때 어떻게 할지 설정합니다 (예: `Restart application`을 선택하여 자동으로 재시작되도록 합니다).
* "Install Service" 버튼을 클릭하여 서비스를 등록합니다.

### 3\. 서비스 시작

* Windows 서비스 관리자(`services.msc` 실행)에서 등록된 서비스(`LogTailorService` 등)를 찾아 시작합니다.
* 또는 명령 프롬프트에서 `net start <서비스_이름>` (예: `net start LogTailorService`) 명령어를 사용합니다.

-----

## 방법 2: sc.exe (Service Control) 사용 (Windows 내장)

`sc.exe`는 Windows에 내장된 명령줄 도구로, 별도의 프로그램 설치 없이 서비스를 등록할 수 있습니다. NSSM만큼 유연하지는 않지만, 간단한 서비스 등록에는 충분합니다.

### 1\. 관리자 권한으로 명령 프롬프트(CMD) 또는 PowerShell을 엽니다.

### 2\. 서비스 생성

* 다음 명령어를 사용하여 서비스를 생성합니다. 모든 경로는 **절대 경로**여야 하며, 공백이 포함된 경로는 큰따옴표로 묶어야 합니다.
* `binPath`에는 실행 파일 경로와 인자를 함께 지정합니다.
  ```bash
  sc create <서비스_이름> binPath= "<log-tailor.exe의_절대_경로> --log-file \"<로그_파일의_절대_경로>\"" DisplayName= "<서비스_표시_이름>" start= auto
  ```
* **예시:**
  ```bash
  sc create LogTailorService binPath= "\"C:\Shock\workspace\log-tailor\log-tailor.exe\" --log-file \"C:\Shock\workspace\log-tailor\custom.log\"" DisplayName= "Log Tailor Service" start= auto
  ```
    * `binPath=` 뒤에 한 칸 띄고 큰따옴표로 전체 경로와 인자를 묶습니다.
    * 인자 내의 큰따옴표는 백슬래시(`\`)로 이스케이프(`\"`)해야 합니다.
    * `DisplayName`: 서비스 관리자에 표시될 이름입니다.
    * `start= auto`: 시스템 시작 시 자동으로 서비스가 시작되도록 설정합니다.

### 3\. 서비스 시작

* Windows 서비스 관리자(`services.msc` 실행)에서 등록된 서비스(`Log Tailor Service` 등)를 찾아 시작합니다.
* 또는 명령 프롬프트에서 `net start <서비스_이름>` (예: `net start LogTailorService`) 명령어를 사용합니다.

### 4\. 서비스 삭제 (필요시)

* `sc delete <서비스_이름>` (예: `sc delete LogTailorService`)

-----

## 주의사항

* **절대 경로**: 서비스 등록 시에는 모든 파일 경로를 **절대 경로**로 지정해야 합니다.
* **로그 파일 경로**: 서비스로 실행될 때도 `server.js`에서 구현한 `--log-file` 인자를 사용하여 로그 파일 경로를 지정하는 것이 좋습니다.
* **권한**: 서비스를 등록하고 시작하려면 **관리자 권한**이 필요합니다.