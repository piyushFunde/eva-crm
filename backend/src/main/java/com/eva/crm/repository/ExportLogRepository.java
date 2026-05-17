package com.eva.crm.repository;

import com.eva.crm.entity.ExportLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ExportLogRepository extends JpaRepository<ExportLog, Long> {
    List<ExportLog> findTop10ByOrderByExportedAtDesc();
}
