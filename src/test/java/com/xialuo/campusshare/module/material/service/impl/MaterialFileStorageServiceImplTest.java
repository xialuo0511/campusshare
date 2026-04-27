package com.xialuo.campusshare.module.material.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.xialuo.campusshare.common.exception.BusinessException;
import com.xialuo.campusshare.module.admin.constant.SystemRuleKeyConstants;
import com.xialuo.campusshare.module.admin.service.SystemRuleConfigService;
import com.xialuo.campusshare.module.material.dto.MaterialFileUploadResponseDto;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

/**
 * Material file storage boundary tests.
 */
class MaterialFileStorageServiceImplTest {

    @TempDir
    Path tempDir;

    @Test
    void UploadMaterialFileShouldRejectUnsupportedExtension() {
        MaterialFileStorageServiceImpl service = new MaterialFileStorageServiceImpl(
            tempDir.toString(),
            BuildRuleService(25, "jpg,png,pdf")
        );
        MockMultipartFile multipartFile = new MockMultipartFile(
            "file",
            "script.exe",
            "application/octet-stream",
            new byte[] {1, 2, 3}
        );

        assertThrows(BusinessException.class, () -> service.UploadMaterialFile(multipartFile));
    }

    @Test
    void UploadMaterialFileShouldRejectOversizeFile() {
        MaterialFileStorageServiceImpl service = new MaterialFileStorageServiceImpl(
            tempDir.toString(),
            BuildRuleService(1, "jpg,png,pdf")
        );
        MockMultipartFile multipartFile = new MockMultipartFile(
            "file",
            "large.pdf",
            "application/pdf",
            new byte[1024 * 1024 + 1]
        );

        assertThrows(BusinessException.class, () -> service.UploadMaterialFile(multipartFile));
    }

    @Test
    void UploadMaterialFileShouldStoreAllowedFile() {
        MaterialFileStorageServiceImpl service = new MaterialFileStorageServiceImpl(
            tempDir.toString(),
            BuildRuleService(25, "jpg,png,pdf")
        );
        MockMultipartFile multipartFile = new MockMultipartFile(
            "file",
            "note.pdf",
            "application/pdf",
            new byte[] {1, 2, 3}
        );

        MaterialFileUploadResponseDto responseDto = service.UploadMaterialFile(multipartFile);

        assertTrue(responseDto.GetFileId().endsWith(".pdf"));
        assertEquals("application/pdf", responseDto.GetFileType());
        assertTrue(Files.exists(service.GetMaterialFilePath(responseDto.GetFileId())));
    }

    @Test
    void GetMaterialFilePathShouldRejectPathTraversal() {
        MaterialFileStorageServiceImpl service = new MaterialFileStorageServiceImpl(
            tempDir.toString(),
            BuildRuleService(25, "jpg,png,pdf")
        );

        assertThrows(BusinessException.class, () -> service.GetMaterialFilePath("../secret.pdf"));
    }

    private SystemRuleConfigService BuildRuleService(Integer maxSizeMb, String allowedExtensions) {
        SystemRuleConfigService systemRuleConfigService = mock(SystemRuleConfigService.class);
        when(systemRuleConfigService.GetRuleIntegerValueOrDefault(
            eq(SystemRuleKeyConstants.MATERIAL_FILE_MAX_SIZE_MB),
            eq(25)
        )).thenReturn(maxSizeMb);
        when(systemRuleConfigService.GetRuleValueOrDefault(
            eq(SystemRuleKeyConstants.MATERIAL_FILE_ALLOWED_EXTENSIONS),
            eq("jpg,jpeg,png,pdf")
        )).thenReturn(allowedExtensions);
        return systemRuleConfigService;
    }
}
